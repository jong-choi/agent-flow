import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getWorkflowWithGraph } from "@/db/query/workflows";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";

export async function WorkflowPreviewDialog({
  workflowId,
}: {
  workflowId: string;
}) {
  const workflowData = await getWorkflowWithGraph(workflowId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <span>그래프 보기</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        ariaDescribedby="workflow preview dialog"
      >
        <DialogTitle>
          {workflowData?.workflow.title ?? "제목이 없습니다."}
        </DialogTitle>
        <CanvasPreview
          nodes={workflowData?.nodes ?? []}
          edges={workflowData?.edges ?? []}
        />
      </DialogContent>
    </Dialog>
  );
}
