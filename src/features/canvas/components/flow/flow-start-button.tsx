"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function FlowStartButton() {
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const chatId = useSearchParams().get("thread_id");
  const disabled = !isValidGraph || !!chatId;

  const setSearchParams = useSetSearchParams();

  const handleStart = useCallback(() => {
    setSearchParams({ thread_id: crypto.randomUUID() });
  }, [setSearchParams]);

  return (
    <Button type="button" disabled={disabled} onClick={handleStart}>
      채팅하기
    </Button>
  );
}
