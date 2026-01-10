import { Suspense } from "react";
import { ChatPanelWithSearchParams } from "@/features/canvas/components/chat/chat-panel-with-search-params";
import { ChatPanelContainer } from "@/features/canvas/components/chat/chat-panel/chat-panel-container";
import { ChatPanelContent } from "@/features/canvas/components/chat/chat-panel/chat-panel-content";

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
