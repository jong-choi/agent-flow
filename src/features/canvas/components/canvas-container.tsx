"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultWorkflowState,
  type WorkflowState,
} from "@/features/canvas/store/slices/workflow-slice";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function CanvasContainer({ children }: { children: React.ReactNode }) {
  const workflow = useCanvasStore((s) => s.workflow);
  const setWorkflow = useCanvasStore((s) => s.setWorkflow);

  const safeWorkflow: WorkflowState = workflow ?? defaultWorkflowState;

  const handleTitleChange = (value: string) => {
    setWorkflow({ ...safeWorkflow, title: value });
  };

  const handleDescriptionChange = (value: string) => {
    setWorkflow({ ...safeWorkflow, description: value });
  };

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="workflow-title">이름</Label>
          <Input
            id="workflow-title"
            value={safeWorkflow.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            placeholder="워크플로우 이름"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="workflow-description">설명</Label>
          <Textarea
            id="workflow-description"
            value={safeWorkflow.description ?? ""}
            onChange={(event) => handleDescriptionChange(event.target.value)}
            placeholder="워크플로우 설명"
          />
        </div>
      </div>
      {children}
    </div>
  );
}
