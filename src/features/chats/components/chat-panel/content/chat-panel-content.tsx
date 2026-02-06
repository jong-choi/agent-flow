"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "@/features/chats/components/chat-panel/content/chat-messages/chat-messages";
import { ChatNoMessage } from "@/features/chats/components/chat-panel/content/chat-messages/chat-no-message";
import { ChatStreamingMessages } from "@/features/chats/components/chat-panel/content/chat-messages/chat-streaming-messages";
import { ChatPanelInputForm } from "@/features/chats/components/chat-panel/content/chat-panel-input-form";
import { useChatStore } from "@/features/chats/store/chat-store";

const SCROLL_OFFSET = 100;
export const BOTTOM_PADDING = 30;

export function ChatPanelContent() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const setLastMessageHeight = useChatStore((s) => s.setLastMessageHeight);
  const isMessage = useChatStore((s) => Boolean(s.messages.length));
  const isStreaming = useChatStore((s) => s.isStreaming);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    // 스트리밍 시작 시 스크롤 로직 시작
    if (isStreaming && scrollElement) {
      setLastMessageHeight(
        scrollElement.clientHeight - SCROLL_OFFSET - BOTTOM_PADDING,
      );
      requestAnimationFrame(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [isStreaming, setLastMessageHeight]);

  return (
    <div className="flex h-full flex-col justify-center p-2">
      {isMessage && (
        <ScrollArea className="min-h-0 flex-1 px-4" ref={scrollAreaRef}>
          <ChatMessages />
          <ChatStreamingMessages />
        </ScrollArea>
      )}
      {!isMessage && <ChatNoMessage />}
      <div className="shrink-0">
        <ChatPanelInputForm />
      </div>
    </div>
  );
}
