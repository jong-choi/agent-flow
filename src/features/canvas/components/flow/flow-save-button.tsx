"use client";

import { type FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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

export function FlowSaveButton() {
  const router = useRouter();
  const { getEdges, getNodes } = useCanvasReactFlow();
  const workflow = useCanvasStore((s) => s.workflow);

  const isValidGraph = useCanvasStore((s) => s.isValidGraph);

  const [title, setTitle] = useState(workflow.title);
  const [description, setDescription] = useState(workflow.description || "");

  const setWorkflow = useCanvasStore((s) => s.setWorkflow);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      if (!isValidGraph) {
        return;
      }

      if (!title) {
        toast.error("워크플로우 이름을 입력해주세요.");
        return;
      }

      const nodes = getNodes();
      const edges = getEdges();
      const presetIds = extractPresetIdsFromNodes(nodes);

      const requestBody: WorkflowSaveRequest = {
        title,
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
              : "워크플로우 저장에 실패했습니다.";
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
          title: payload?.data?.title ?? title,
          description:
            payload?.data?.description ?? requestBody.description ?? null,
        });

        setOpen(false);
        toast.success("저장되었습니다.");
      } catch (error) {
        console.error("워크플로우 저장 중 오류:", error);
        const message =
          error instanceof Error ? error.message : "워크플로우 저장 실패";
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
      title,
      workflow.id,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={!isValidGraph}>
          저장
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        ariaDescribedby="workflow save dialog"
      >
        <DialogHeader>
          <DialogTitle>워크플로우 저장</DialogTitle>
          <DialogDescription>
            이름과 설명을 입력한 뒤 저장하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="workflow-dialog-title">이름</Label>
            <Input
              id="workflow-dialog-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="워크플로우 이름"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workflow-dialog-description">설명</Label>
            <Textarea
              id="workflow-dialog-description"
              name="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value.replace(/[\r\n]+/g, "").slice(0, 140),
                )
              }
              placeholder="워크플로우 설명"
              className="h-30 overflow-y-auto"
              maxLength={140}
            />
            <p className="text-xs text-muted-foreground">
              최대 140자까지 입력할 수 있어요.
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
                닫기
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !title || !isValidGraph}
              className="w-16"
            >
              {isSaving ? <Spinner className="size-4" /> : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
