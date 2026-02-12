"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { type WorkflowSaveRequest } from "@/app/api/workflows/_types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { extractPresetIdsFromNodes } from "@/features/canvas/utils/preset-import";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function FlowSaveButton() {
  const t = useTranslations<AppMessageKeys>("Workflows");
  const router = useRouter();
  const { getEdges, getNodes } = useCanvasReactFlow();
  const workflow = useCanvasStore((s) => s.workflow);

  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const isEditMode = Boolean(workflow.id);

  const [title, setTitle] = useState(workflow.title ?? "");
  const [description, setDescription] = useState(workflow.description ?? "");
  const setWorkflow = useCanvasStore((s) => s.setWorkflow);
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hydrateFormFromWorkflow = useCallback(() => {
    setTitle(workflow.title ?? "");
    setDescription(workflow.description ?? "");
  }, [workflow.description, workflow.title]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        hydrateFormFromWorkflow();
      }

      setIsDirty(false);
      setOpen(nextOpen);
    },
    [hydrateFormFromWorkflow],
  );

  useEffect(() => {
    if (!open || isDirty) {
      return;
    }

    hydrateFormFromWorkflow();
  }, [hydrateFormFromWorkflow, isDirty, open]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      if (!isValidGraph) {
        return;
      }

      const normalizedTitle = title.trim();
      if (!normalizedTitle) {
        toast.error(t("canvas.save.validation.titleRequired"));
        return;
      }

      const nodes = getNodes();
      const edges = getEdges();
      const presetIds = extractPresetIdsFromNodes(nodes);

      const requestBody: WorkflowSaveRequest = {
        title: normalizedTitle,
        description,
        nodes,
        edges,
        presetIds,
      };

      try {
        setIsSaving(true);

        const workflowId = workflow.id;
        const target = workflowId
          ? `/api/workflows/${workflowId}`
          : "/api/workflows";
        const response = await fetch(target, {
          method: workflowId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          const message =
            typeof payload?.error === "string"
              ? payload.error
              : t("canvas.save.errors.saveFailed");
          throw new Error(message);
        }

        const payload = (await response.json()) as {
          data?: { id?: string; title?: string; description?: string | null };
        };
        const nextId = payload?.data?.id ?? workflowId;

        if (!workflowId && nextId) {
          router.push(`/workflows/canvas/${nextId}`);
        }

        setWorkflow({
          id: nextId ?? workflowId,
          title: payload?.data?.title ?? normalizedTitle,
          description:
            payload?.data?.description ?? requestBody.description ?? null,
        });

        setOpen(false);
        toast.success(t("canvas.save.toast.success"));
      } catch (error) {
        console.error("Error while saving workflow:", error);
        const message =
          error instanceof Error
            ? error.message
            : t("canvas.save.errors.fallback");
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [
      description,
      getEdges,
      getNodes,
      isSaving,
      isValidGraph,
      router,
      setWorkflow,
      t,
      title,
      workflow.id,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={!isValidGraph}>
          {t("canvas.actions.save")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        ariaDescribedby="workflow-save-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t("canvas.save.dialog.titleEdit")
              : t("canvas.save.dialog.titleCreate")}
          </DialogTitle>
          <DialogDescription id="workflow-save-dialog-description">
            {isEditMode
              ? t("canvas.save.dialog.descriptionEdit")
              : t("canvas.save.dialog.descriptionCreate")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="workflow-dialog-title">
              {t("canvas.save.dialog.nameLabel")}
            </Label>
            <Input
              id="workflow-dialog-title"
              name="title"
              value={title}
              onChange={(event) => {
                setIsDirty(true);
                setTitle(event.target.value);
              }}
              placeholder={t("canvas.save.dialog.namePlaceholder")}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workflow-dialog-description">
              {t("canvas.save.dialog.descriptionLabel")}
            </Label>
            <Textarea
              id="workflow-dialog-description"
              name="description"
              value={description}
              onChange={(event) => {
                setIsDirty(true);
                setDescription(
                  event.target.value.replace(/[\r\n]+/g, "").slice(0, 140),
                );
              }}
              placeholder={t("canvas.save.dialog.descriptionPlaceholder")}
              className="h-30 overflow-y-auto"
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              {t("canvas.save.dialog.descriptionLimit")}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                className="w-16"
              >
                {t("canvas.save.dialog.close")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !title.trim() || !isValidGraph}
              className="w-16"
            >
              {isSaving ? (
                <Spinner className="size-4" />
              ) : isEditMode ? (
                t("canvas.save.dialog.submitEdit")
              ) : (
                t("canvas.save.dialog.submitCreate")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
