import { View } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getWorkflowWithGraphForChat } from "@/features/chats/server/queries";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";

export async function ChatWorkflowPreviewDialog({
  workflowId,
}: {
  workflowId: string;
}) {
  const workflowData = await getWorkflowWithGraphForChat(workflowId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          title="그래프 보기"
          className="text-muted-foreground"
          size="sm"
        >
          <View />
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
