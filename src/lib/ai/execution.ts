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
    if (!response.body) {
      finish();
      return response;
    }
    // Track the consumed body directly. A tee/clone can leave an unhandled
    // Undici rejection when an HTTP error is rejected before its body is read.
    const reader = response.body.getReader();
    void reader.closed.catch(() => {});
    let settled = false;
    let controller: ReadableStreamDefaultController<Uint8Array>;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      try {
        reader.releaseLock();
      } catch {
        /* a pending read is cancelled below */
      }
      finish();
    };
    const abort = () => {
      if (settled) return;
      controller.error(signal.reason);
      void reader
        .cancel(signal.reason)
        .catch(() => {})
        .finally(cleanup);
    };
    const body = new ReadableStream<Uint8Array>({
      start(current) {
        controller = current;
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      },
      async pull(current) {
        try {
          const chunk = await reader.read();
          if (settled) return;
          if (chunk.done) {
            current.close();
            cleanup();
          } else current.enqueue(chunk.value);
        } catch (error) {
          if (!settled) current.error(error);
          cleanup();
        }
      },
      async cancel(reason) {
        try {
          await reader.cancel(reason);
        } finally {
          cleanup();
        }
      },
    });
    const tracked = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    for (const field of ["url", "redirected", "type"] as const)
      Object.defineProperty(tracked, field, { value: response[field] });
    return tracked;
  } catch (error) {
    finish();
    throw error;
  }
};

/** Observe only the provider operation, excluding billing, replay and admission failures. */
export async function observeModelCall<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: {
    model: AiModel;
    signal: AbortSignal;
    source?: "runtime" | "probe";
    expectAnswer?: boolean;
  },
): Promise<T> {
  const { assertModelAdmission, recordObservation } = await import(
    "./maintenance/state-store"
  );
  await assertModelAdmission(options.model.id, options.source === "probe");
  let result: T;
  try {
    result = await operation(options.signal);
    options.signal.throwIfAborted();
    if (options.expectAnswer !== false)
      assertCompleteAnswer(result as { content: unknown });
  } catch (error) {
    try {
      await recordObservation(options.model, {
        ok: false,
        source: options.source ?? "runtime",
        at: Date.now(),
        error: normalizeProviderError(
          options.signal.aborted ? options.signal.reason : error,
        ),
      });
    } catch {
      console.warn(
        "Could not persist model health observation",
        options.model.id,
      );
    }
    throw options.signal.aborted ? options.signal.reason : error;
  }
  await recordObservation(options.model, {
    ok: true,
    source: options.source ?? "runtime",
    at: Date.now(),
  });
  return result;
}

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
    return await context.run(scope, () =>
      options.observe
        ? observeModelCall(operation, { ...options.observe, signal })
        : operation(signal),
    );
  } catch (error) {
    if (signal.aborted) throw signal.reason;
    throw error;
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    // Also terminates transports when a caller stops consuming or rejects early.
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
