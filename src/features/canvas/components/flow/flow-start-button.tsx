"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function FlowStartButton() {
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const loading = useCanvasStore((s) => s.isStartLoading);
  const setLoading = useCanvasStore((s) => s.setIsStartLoading);
  const thread_id = useSearchParams().get("thread_id");
  const { getEdges, getNodes } = useReactFlow();

  const disabled = !isValidGraph || !!thread_id || loading;

  const setSearchParams = useSetSearchParams();

  const handleStart = useCallback(async () => {
    if (loading || !isValidGraph || thread_id) return;

    setLoading(true);

    const edges = getEdges();
    const nodes = getNodes();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : "채팅을 생성하지 못했습니다.";
        throw new Error(message);
      }

      const payload = (await response.json()) as {
        data?: { thread_id?: string };
      };
      const nextThreadId = payload?.data?.thread_id;

      if (!nextThreadId) {
        throw new Error("채팅 ID가 발급되지 않았습니다.");
      }

      setSearchParams({ thread_id: nextThreadId });
    } catch (error) {
      console.error("채팅 생성 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [
    thread_id,
    getEdges,
    getNodes,
    isValidGraph,
    loading,
    setLoading,
    setSearchParams,
  ]);

  return (
    <Button
      type="button"
      className="min-w-24"
      disabled={disabled}
      onClick={handleStart}
    >
      {loading ? <Spinner className="size-4" /> : "채팅하기"}
    </Button>
  );
}
