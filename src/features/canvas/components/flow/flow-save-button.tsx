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

export function FlowSaveButton() {
  const router = useRouter();
  const { getEdges, getNodes } = useCanvasReactFlow();
  const workflow = useCanvasStore((s) => s.workflow);
  const title = useCanvasStore((s) => s.workflow.title.trim());
  const isValidGraph = useCanvasStore((s) => s.isValidGraph);
  const description = useCanvasStore((s) => s.workflow.description?.trim());

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

      const requestBody: WorkflowSaveRequest = {
        title,
        description,
        nodes,
        edges,
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
          router.push(`/canvas/${nextId}`);
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

  const handleTitleChange = (value: string) => {
    setWorkflow({ ...workflow, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setWorkflow({ ...workflow, description: value });
  };

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
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="워크플로우 이름"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="workflow-dialog-description">설명</Label>
            <Textarea
              id="workflow-dialog-description"
              name="description"
              value={description ?? ""}
              onChange={(event) => handleDescriptionChange(event.target.value)}
              placeholder="워크플로우 설명"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isSaving}>
                닫기
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !title || !isValidGraph}
            >
              {isSaving ? <Spinner className="size-4" /> : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
