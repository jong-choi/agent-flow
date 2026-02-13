import { ChatWorkflowListDialogClient } from "@/features/chats/components/chat-page/chat-workflow-list-dialog-client";
import { getOwnedWorkflowsForChatPage } from "@/features/chats/server/queries";

export async function ChatWorkflowListDialog() {
  const initialPage = await getOwnedWorkflowsForChatPage({ limit: 20 });

  return <ChatWorkflowListDialogClient initialPage={initialPage} />;
}
