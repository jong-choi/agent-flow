import { getTranslations } from "next-intl/server";
import { ChatHeaderMenu } from "@/features/chats/components/chat-page/chat-header-menu";
import { ChatHeaderTitle } from "@/features/chats/components/chat-page/chat-header-title";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type ChatHeaderProps = {
  locale: string;
  chatId: string;
  chatTitle: string | null;
  workflowTitle?: string | null;
  workflowId?: string | null;
};

export async function ChatHeader({
  locale,
  chatId,
  chatTitle,
  workflowTitle,
  workflowId,
}: ChatHeaderProps) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });
  const resolvedWorkflowTitle = workflowTitle?.trim() || t("header.noWorkflow");

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 px-6 py-2 backdrop-blur">
      <div className="flex justify-between">
        <ChatHeaderTitle chatId={chatId} chatTitle={chatTitle} />
        <ChatHeaderMenu
          locale={locale}
          workflowId={workflowId}
          workflowTitle={resolvedWorkflowTitle}
        />
      </div>
    </header>
  );
}
