import { Suspense } from "react";
import { ChatEventWrapper } from "@/features/chat/components/chat-panel/chat-event-wrapper";
import { ChatPanelContainer } from "@/features/chat/components/chat-panel/chat-panel-container";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";

export default function ChatPanelPage() {
  return (
    <Suspense>
      <ChatEventWrapper>
        <ChatPanelContainer>
          <ChatPanelContent />
        </ChatPanelContainer>
      </ChatEventWrapper>
    </Suspense>
  );
}
