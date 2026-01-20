import { Suspense } from "react";
import { ChatPanelContainer } from "@/features/chat/components/chat-panel/chat-panel-container";
import { ChatPanelWithSearchParams } from "@/features/chat/components/chat-panel/chat-panel-with-search-params";
import { ChatPanelContent } from "@/features/chat/components/chat-panel/content/chat-panel-content";
import { ChatStoreProvider } from "@/features/chat/store/chat-store";

export default function ChatPanelPage() {
  return (
    <Suspense>
      <ChatPanelWithSearchParams>
        <ChatStoreProvider>
          <ChatPanelContainer>
            <ChatPanelContent />
          </ChatPanelContainer>
        </ChatStoreProvider>
      </ChatPanelWithSearchParams>
    </Suspense>
  );
}
