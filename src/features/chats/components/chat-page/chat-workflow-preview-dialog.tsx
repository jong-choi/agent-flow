"use client";

import { useState } from "react";
import { View } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CanvasPreview } from "@/features/canvas/components/cavas-preview/canvas-preview";
import { getWorkflowWithGraphForChatAction } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function ChatWorkflowPreviewDialog({
  workflowId,
}: {
  workflowId: string;
}) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState<Awaited<
    ReturnType<typeof getWorkflowWithGraphForChatAction>
  > | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen || workflowData || isLoading) {
      return;
    }

    setIsLoading(true);
    void getWorkflowWithGraphForChatAction({ workflowId })
      .then((data) => {
        setWorkflowData(data ?? null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {workflowData?.workflow.title?.trim() || t("dialog.untitledWorkflow")}
        </DialogTitle>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-4" />
          </div>
        ) : (
          <CanvasPreview
            nodes={workflowData?.nodes ?? []}
            edges={workflowData?.edges ?? []}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
