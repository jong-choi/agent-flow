"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function FlowStartButton() {
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const chatId = useSearchParams().get("thread_id");
  const { getEdges, getNodes } = useReactFlow();
  const [loading, setLoading] = useState(false);

  const disabled = !isValidGraph || !!chatId || loading;

  const setSearchParams = useSetSearchParams();

  const handleStart = useCallback(async () => {
    if (loading || !isValidGraph || chatId) return;

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
  }, [chatId, getEdges, getNodes, isValidGraph, loading, setSearchParams]);

  return (
    <Button
      type="button"
      className="min-w-24"
      disabled={disabled}
      onClick={handleStart}
    >
      채팅하기
    </Button>
  );
}
