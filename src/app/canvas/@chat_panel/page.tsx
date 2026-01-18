import { Suspense } from "react";
import { ChatPanelContainer } from "@/features/chat/components/chat-panel/chat-panel-container";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/chat-panel-content";
import { ChatPanelWithSearchParams } from "@/features/chat/components/chat-panel/chat-panel-with-search-params";

export default function ChatPanelPage() {
  return (
    <Suspense>
      <ChatPanelWithSearchParams>
        <ChatPanelContainer>
          <ChatPanelContent />
        </ChatPanelContainer>
      </ChatPanelWithSearchParams>
    </Suspense>
  );
}
