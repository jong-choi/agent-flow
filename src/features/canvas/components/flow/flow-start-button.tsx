"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function FlowStartButton() {
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);

  const setSearchParams = useSetSearchParams();

  const handleStart = useCallback(() => {
    setSearchParams({ chat_id: crypto.randomUUID() });
  }, [setSearchParams]);

  return (
    <Button type="button" disabled={!isValidGraph} onClick={handleStart}>
      시작하기
    </Button>
  );
}
