"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { type Locale } from "@/lib/i18n/routing";

export function FlowLoadPresetButton() {
  const locale = useLocale() as Locale;
  const t = useTranslations<AppMessageKeys>("Workflows");
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
    if (presets.length === 0) return t("canvas.loadPreset.empty.noOwned");
    if (filteredPresets.length === 0) {
      if (workflowId && hasCycleBlockedPresets) {
        return t("canvas.loadPreset.empty.cycleBlocked");
      }
      return t("canvas.loadPreset.empty.noMatch");
    }
    return null;
  }, [
    t,
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
        const graph = await getPresetGraphForCanvasAction(presetId, locale);

        if (graph.nodes.length === 0) {
          throw new Error(t("canvas.loadPreset.errors.noNodes"));
        }

        appendPresetGraphToCanvas(graph);
        setOpen(false);
        toast.success(t("canvas.loadPreset.toast.appended"));
      } catch (error) {
        console.error("Error while loading preset:", error);
        const message =
          error instanceof Error
            ? error.message
            : t("canvas.loadPreset.errors.loadFailed");
        toast.error(message);
      } finally {
        setActivePresetId(null);
      }
    },
    [activePresetId, appendPresetGraphToCanvas, locale, t],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {t("canvas.actions.loadPreset")}
        </Button>
      </DialogTrigger>
      <DialogContent
        ariaDescribedby="preset load dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>{t("canvas.loadPreset.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("canvas.loadPreset.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("canvas.loadPreset.dialog.searchPlaceholder")}
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
