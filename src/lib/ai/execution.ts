import { AsyncLocalStorage } from "node:async_hooks";
import { setTimeout as delay } from "node:timers/promises";
import postgres from "postgres";
import type { AiModel } from "@/db/schema/ai-models";
import { normalizeProviderError } from "./error";
import { assertCompleteAnswer } from "./message";

interface CallContext {
  signal: AbortSignal;
  transports: Promise<unknown>[];
}
const context = new AsyncLocalStorage<CallContext>();

/** Used by every provider transport so cancellation reaches the network, not just LangChain. */
export const aiFetch: typeof fetch = async (input, init) => {
  const scope = context.getStore();
  if (!scope) throw new Error("AI requests must run through runAiCall");
  const requestSignal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const signal = requestSignal
    ? AbortSignal.any([scope.signal, requestSignal])
    : scope.signal;
  let finish!: () => void;
  scope.transports.push(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  try {
    const response = await fetch(input, { ...init, signal });
    if (response.body) {
      // Drain a clone without buffering. Keep the lease until the HTTP stream has settled.
      const reader = response.clone().body!.getReader();
      const cancel = () => {
        void reader.cancel().catch(() => {});
      };
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
      void (async () => {
        try {
          while (!(await reader.read()).done) {
            /* discard diagnostic branch */
          }
        } catch {
          /* the provider consumer receives the transport error */
        } finally {
          signal.removeEventListener("abort", cancel);
          reader.releaseLock();
          finish();
        }
      })();
    } else finish();
    return response;
  } catch (error) {
    finish();
    throw error;
  }
};

/** Session-level PostgreSQL advisory lock shared by web, CLI, and future maintenance workers. */
export async function runAiCall<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    observe?: {
      model: AiModel;
      source?: "runtime" | "probe";
      expectAnswer?: boolean;
    };
  } = {},
): Promise<T> {
  if (context.getStore())
    throw new Error(
      "Nested runAiCall is not supported; queue individual model invocations",
    );
  const stop = new AbortController();
  const signal = AbortSignal.any([
    stop.signal,
    AbortSignal.timeout(options.timeoutMs ?? 120_000),
    ...(options.signal ? [options.signal] : []),
  ]);
  signal.throwIfAborted();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for the shared AI queue");
  // A dedicated session is essential: transaction poolers are not supported for this lock.
  let locked = false;
  const sql = postgres(url, {
    max: 1,
    idle_timeout: 0,
    max_lifetime: 0,
    connect_timeout: 5,
    onclose: () => {
      if (locked) stop.abort(new Error("AI execution lock connection lost"));
    },
  });
  const scope: CallContext = { signal, transports: [] };
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let callStarted = false;
  try {
    while (!locked) {
      signal.throwIfAborted();
      const [row] = await sql<
        { locked: boolean }[]
      >`select pg_try_advisory_lock(21465, 1) as locked`;
      locked = row.locked;
      if (!locked) await delay(100, undefined, { signal });
    }
    signal.throwIfAborted();
    heartbeat = setInterval(() => {
      void sql`select 1`.catch(() =>
        stop.abort(new Error("AI execution lock connection lost")),
      );
    }, 5000);
    return await context.run(scope, async () => {
      if (options.observe) {
        const { assertModelAdmission } = await import(
          "./maintenance/state-store"
        );
        await assertModelAdmission(
          options.observe.model.id,
          options.observe.source === "probe",
        );
      }
      callStarted = true;
      const result = await operation(signal);
      if (options.observe) {
        if (options.observe.expectAnswer !== false)
          assertCompleteAnswer(result as { content: unknown });
        const { recordObservation } = await import("./maintenance/state-store");
        await recordObservation(options.observe.model, {
          ok: true,
          source: options.observe.source ?? "runtime",
          at: Date.now(),
        });
      }
      return result;
    });
  } catch (error) {
    if (options.observe && callStarted) {
      try {
        const { recordObservation } = await import("./maintenance/state-store");
        await recordObservation(options.observe.model, {
          ok: false,
          source: options.observe.source ?? "runtime",
          at: Date.now(),
          error: normalizeProviderError(signal.aborted ? signal.reason : error),
        });
      } catch {
        console.warn(
          "Could not persist model health observation",
          options.observe.model.id,
        );
      }
    }
    if (signal.aborted) throw signal.reason;
    throw error;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    // Also terminates transports when a caller stops consuming or LangChain rejects early.
    stop.abort();
    await Promise.allSettled(scope.transports);
    if (locked) {
      try {
        await sql`select pg_advisory_unlock(21465, 1)`;
      } catch {
        /* closing session releases it */
      }
    }
    locked = false;
    await sql.end({ timeout: 1 });
  }
}
