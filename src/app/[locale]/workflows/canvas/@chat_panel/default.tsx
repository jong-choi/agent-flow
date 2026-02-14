"use client";

import { Suspense } from "react";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { ChatEventWrapper } from "@/features/chats/components/chat-panel/chat-event-wrapper";
import { ChatPanelContainer } from "@/features/chats/components/chat-panel/chat-panel-container";
import { ChatPanelContent } from "@/features/chats/components/chat-panel/content/chat-panel-content";

export default function ChatPanelPage() {
  const threadId = useCanvasStore((s) => s.threadId);
  const setThreadId = useCanvasStore((s) => s.setThreadId);
  const handleThreadInvalid = () => {
    setThreadId(null);
  };

  if (!threadId) {
    return null;
  }

  return (
    <Suspense>
      <ChatEventWrapper
        key={threadId}
        initialThreadId={threadId}
        onInvalidThreadId={handleThreadInvalid}
      >
        <ChatPanelContainer>
          <ChatPanelContent />
        </ChatPanelContainer>
      </ChatEventWrapper>
    </Suspense>
  );
}
