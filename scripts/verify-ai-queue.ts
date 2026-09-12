/** Local DB integration test. No external AI calls. */
import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { runAiCall } from "../src/lib/ai/execution";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.equal(
    url.hostname,
    "127.0.0.1",
    "Queue verification requires local DB",
  );
  if (process.argv[2] === "worker") {
    const name = process.argv[3];
    const abort = new AbortController();
    let timer =
      name === "cancel" ? setTimeout(() => abort.abort(), 200) : undefined;
    try {
      await runAiCall(
        async (signal) => {
          process.send?.({ name, event: "start" });
          if (name === "abort-running")
            timer = setTimeout(() => abort.abort(), 100);
          try {
            if (name === "hold") {
              await new Promise<void>((resolve, reject) => {
                const release = () => {
                  signal.removeEventListener("abort", cancelled);
                  resolve();
                };
                const cancelled = () => {
                  process.off("message", release);
                  reject(signal.reason);
                };
                process.once("message", release);
                signal.addEventListener("abort", cancelled, { once: true });
              });
            } else
              await delay(name === "abort-running" ? 5000 : 100, undefined, {
                signal,
              });
          } finally {
            process.send?.({ name, event: "end" });
          }
          if (name === "failure") throw new Error("Expected mock failure");
        },
        { signal: abort.signal },
      );
    } catch (error) {
      process.send?.({
        name,
        event: "error",
        message: error instanceof Error ? error.name : "unknown",
      });
      if (name !== "cancel" && name !== "failure" && name !== "abort-running")
        throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
    return;
  }
  const events: { name: string; event: string }[] = [];
  const launch = (name: string) => {
    let ready!: () => void;
    const started = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const child = spawn(
      process.execPath,
      ["--import", "tsx", process.argv[1], "worker", name],
      { stdio: ["ignore", "ignore", "inherit", "ipc"] },
    );
    child.on("message", (message: { name: string; event: string }) => {
      events.push(message);
      if (message.event === "start") ready();
    });
    const done = new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Worker ${name} exited ${code}`)),
      );
    });
    return {
      started: Promise.race([
        started,
        done.then(() => {
          throw new Error(`Worker ${name} exited before acquiring the lock`);
        }),
      ]),
      done,
      release: () => child.send("release"),
    };
  };
  const hold = launch("hold");
  await hold.started;
  const queued = launch("next");
  const cancel = launch("cancel");
  await cancel.done;
  hold.release();
  await Promise.all([hold.done, queued.done]);
  const failure = launch("failure");
  await failure.done;
  const running = launch("abort-running");
  await running.done;
  const after = launch("after");
  await after.done;
  let active = 0;
  for (const event of events) {
    if (event.event === "start") {
      active++;
      assert.equal(active, 1);
    }
    if (event.event === "end") active--;
  }
  assert.equal(active, 0);
  assert.ok(!events.some((e) => e.name === "cancel" && e.event === "start"));
  assert.ok(events.some((e) => e.name === "cancel" && e.event === "error"));
  assert.ok(events.some((e) => e.name === "after" && e.event === "end"));
  console.log(
    "PASS: cross-process serialization, queued cancellation, failure release, subsequent acquisition",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
