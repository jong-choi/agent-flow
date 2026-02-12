import {
  WorkflowAvatar,
  WorkflowDescriptionText,
  WorkflowTitleText,
  WorkflowUpdatedAtText,
} from "@/components/workflow/workflow-summary-parts";
import { type ChatPageWorkflow } from "@/features/chats/components/chat-page/chat-queries";
import { ChatStartButton } from "@/features/chats/components/chat-page/chat-start-button";
import { ChatWorkflowPreviewDialog } from "@/features/chats/components/chat-page/chat-workflow-preview-dialog";

export function ChatWorkflowCard({
  workflow,
  locale,
}: {
  workflow: ChatPageWorkflow;
  locale: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background p-4"
      key={workflow.id}
    >
      <div className="flex items-start justify-between gap-2">
        <WorkflowTitleText title={workflow.title} />
        <WorkflowUpdatedAtText
          updatedAt={workflow.updatedAt}
          className="shrink-0"
        />
      </div>
      <WorkflowDescriptionText
        description={workflow.description}
        className="h-6 truncate"
      />
      <div className="mt-2 flex items-end justify-between">
        <div className="mr-2 mb-1">
          <WorkflowAvatar workflowId={workflow.id} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <ChatWorkflowPreviewDialog locale={locale} workflowId={workflow.id} />
          <ChatStartButton workflowId={workflow.id} />
        </div>
      </div>
    </div>
  );
}
