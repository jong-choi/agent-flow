import { ChatHeaderMenu } from "@/features/chats/components/chat-page/chat-header-menu";
import { ChatHeaderTitle } from "@/features/chats/components/chat-page/chat-header-title";

type ChatHeaderProps = {
  chatId: string;
  chatTitle: string | null;
  createdAt: Date | string;
  workflowTitle?: string | null;
  workflowId?: string | null;
};

export function ChatHeader({
  chatId,
  chatTitle,
  workflowTitle,
  workflowId,
}: ChatHeaderProps) {
  const resolvedWorkflowTitle = workflowTitle?.trim() || "워크플로우 없음";

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 px-6 py-2 backdrop-blur">
      <div className="flex justify-between">
        <ChatHeaderTitle chatId={chatId} chatTitle={chatTitle} />
        <ChatHeaderMenu
          workflowId={workflowId}
          workflowTitle={resolvedWorkflowTitle}
        />
      </div>
    </header>
  );
}
