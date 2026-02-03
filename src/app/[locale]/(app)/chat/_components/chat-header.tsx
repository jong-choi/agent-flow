import { ChatHeaderMenu } from "@/app/[locale]/(app)/chat/_components/chat-header-menu";
import { formatKoreanDate } from "@/lib/utils";

type ChatHeaderProps = {
  chatTitle: string | null;
  createdAt: Date | string;
  workflowTitle?: string | null;
  workflowId?: string | null;
};

export function ChatHeader({
  chatTitle,
  createdAt,
  workflowTitle,
  workflowId,
}: ChatHeaderProps) {
  const resolvedChatTitle = chatTitle?.trim() || formatKoreanDate(createdAt);
  const resolvedWorkflowTitle = workflowTitle?.trim() || "워크플로우 없음";

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 px-6 py-2 backdrop-blur">
      <div className="flex justify-between">
        <div className="truncate text-lg font-semibold text-foreground">
          {resolvedChatTitle}
        </div>
        <ChatHeaderMenu
          workflowId={workflowId}
          workflowTitle={resolvedWorkflowTitle}
        />
      </div>
    </header>
  );
}
