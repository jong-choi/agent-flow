import { View } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CanvasPreview } from "@/features/canvas/components/flow/cavas-preview/canvas-preview";
import { getWorkflowWithGraphForChat } from "@/features/chats/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function ChatWorkflowPreviewDialog({
  locale,
  workflowId,
}: {
  locale: string;
  workflowId: string;
}) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });
  const workflowData = await getWorkflowWithGraphForChat(workflowId);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          title={t("action.viewGraph")}
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
          {workflowData?.workflow.title ?? t("dialog.untitledWorkflow")}
        </DialogTitle>
        <CanvasPreview
          nodes={workflowData?.nodes ?? []}
          edges={workflowData?.edges ?? []}
        />
      </DialogContent>
    </Dialog>
  );
}
