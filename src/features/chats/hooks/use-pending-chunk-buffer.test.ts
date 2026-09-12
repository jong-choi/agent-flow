import { afterEach, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePendingChunkBuffer } from "./use-pending-chunk-buffer";

afterEach(() => vi.unstubAllGlobals());
it("flushes the last deltas before completion even when no animation frame has run", () => {
  const append = vi.fn();
  const cancel = vi.fn();
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", cancel);
  const { result, unmount } = renderHook(() =>
    usePendingChunkBuffer({ appendStreamingChunk: append }),
  );
  act(() => {
    result.current.appendPendingChunk("chat", "안녕");
    result.current.appendPendingChunk("chat", " 세상");
  });
  expect(append).not.toHaveBeenCalled();
  act(() => result.current.flushPendingChunks());
  expect(append).toHaveBeenCalledExactlyOnceWith({
    nodeId: "chat",
    delta: "안녕 세상",
  });
  expect(cancel).toHaveBeenCalledWith(1);
  act(() => result.current.flushPendingChunks());
  expect(append).toHaveBeenCalledTimes(1);
  unmount();
});
