import { useCallback, useEffect, useRef } from "react";

/** Batch visual updates, but synchronously flush before finalizing a message. */
export function usePendingChunkBuffer({
  appendStreamingChunk,
}: {
  appendStreamingChunk: (params: { nodeId: string; delta: string }) => void;
}) {
  const pending = useRef<Record<string, string>>({});
  const frame = useRef<number | null>(null);
  const flushPendingChunks = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const entries = Object.entries(pending.current);
    pending.current = {};
    for (const [nodeId, delta] of entries) {
      if (delta) appendStreamingChunk({ nodeId, delta });
    }
  }, [appendStreamingChunk]);
  const appendPendingChunk = useCallback(
    (nodeId: string, delta: string) => {
      pending.current[nodeId] = (pending.current[nodeId] ?? "") + delta;
      if (frame.current === null)
        frame.current = requestAnimationFrame(flushPendingChunks);
    },
    [flushPendingChunks],
  );
  const resetPendingChunks = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    pending.current = {};
  }, []);
  useEffect(() => resetPendingChunks, [resetPendingChunks]);
  return { appendPendingChunk, resetPendingChunks, flushPendingChunks };
}
