"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { getPresetGraphForCanvasAction } from "@/features/presets/server/actions";
import { PresetLibraryItemButton } from "@/features/canvas/components/flow/flow-load-preset/preset-library-item-button";
import { useAppendPresetGraphToCanvas } from "@/features/canvas/hooks/use-append-preset-graph-to-canvas";
import { usePresetLibraryForCanvasQuery } from "@/features/canvas/hooks/use-preset-library-for-canvas-query";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { filterPresetLibrary } from "@/features/canvas/utils/preset-library";

export function FlowLoadPresetButton() {
  const workflowId = useCanvasStore((s) => s.workflow.id);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const { presets, errorMessage, isLoading } =
    usePresetLibraryForCanvasQuery(open);

  const filteredPresets = useMemo(
    () =>
      filterPresetLibrary(presets, {
        query,
        excludeWorkflowId: workflowId || undefined,
      }),
    [presets, query, workflowId],
  );

  const hasCycleBlockedPresets = useMemo(() => {
    if (!workflowId) return false;
    return presets.some((preset) => preset.workflowId === workflowId);
  }, [presets, workflowId]);

  const emptyMessage = useMemo(() => {
    if (isLoading) return null;
    if (errorMessage) return errorMessage;
    if (presets.length === 0) return "보유한 프리셋이 없습니다.";
    if (filteredPresets.length === 0) {
      if (workflowId && hasCycleBlockedPresets) {
        return "이 워크플로우로 만든 프리셋은 불러올 수 없습니다.";
      }
      return "조건에 맞는 프리셋이 없습니다.";
    }
    return null;
  }, [
    errorMessage,
    filteredPresets.length,
    hasCycleBlockedPresets,
    isLoading,
    presets.length,
    workflowId,
  ]);

  const appendPresetGraphToCanvas = useAppendPresetGraphToCanvas();

  const handleSelectPreset = useCallback(
    async (presetId: string) => {
      if (activePresetId) {
        return;
      }

      try {
        setActivePresetId(presetId);
        const graph = await getPresetGraphForCanvasAction(presetId);

        if (graph.nodes.length === 0) {
          throw new Error("프리셋에 추가할 노드가 없습니다.");
        }

        appendPresetGraphToCanvas(graph);
        setOpen(false);
        toast.success("프리셋을 캔버스에 추가했어요.");
      } catch (error) {
        console.error("프리셋 불러오기 오류:", error);
        const message =
          error instanceof Error ? error.message : "프리셋 불러오기 실패";
        toast.error(message);
      } finally {
        setActivePresetId(null);
      }
    },
    [activePresetId, appendPresetGraphToCanvas],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          프리셋 불러오기
        </Button>
      </DialogTrigger>
      <DialogContent
        ariaDescribedby="preset load dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>프리셋 불러오기</DialogTitle>
          <DialogDescription>
            구매했거나 만든 프리셋을 현재 캔버스에 추가할 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="프리셋 검색 (제목)"
          autoComplete="off"
        />

        <ScrollArea className="h-80 overflow-auto rounded-md border">
          <div className="flex flex-col">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="size-4" />
              </div>
            ) : emptyMessage ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredPresets.map((preset) => (
                <PresetLibraryItemButton
                  key={preset.id}
                  preset={preset}
                  disabled={Boolean(activePresetId)}
                  isPending={activePresetId === preset.id}
                  onSelect={() => void handleSelectPreset(preset.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
