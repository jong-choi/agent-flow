import { Play } from "lucide-react";
import { WorkflowPreviewDialog } from "@/app/[locale]/(app)/chat/_components/workflow-preview-dialog";
import { type ChatPageWorkflow } from "@/app/[locale]/(app)/chat/page";
import { Button } from "@/components/ui/button";
import { formatKoreanDate } from "@/lib/utils";

export function WorkflowCard({ workflow }: { workflow: ChatPageWorkflow }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background p-4"
      key={workflow.id}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-semibold text-foreground">
          {workflow.title}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          업데이트 {formatKoreanDate(workflow.updatedAt)}
        </div>
      </div>
      <div className="truncate text-sm text-foreground/80">
        {workflow.description}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button size="sm" type="button">
          <Play />
          채팅 시작
        </Button>
        <WorkflowPreviewDialog workflowId={workflow.id} />
      </div>
    </div>
  );
}
