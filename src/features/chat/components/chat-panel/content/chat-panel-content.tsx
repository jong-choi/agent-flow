"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "@/features/chat/components/chat-panel/content/chat-messages/chat-messages";
import { ChatStreamingMessages } from "@/features/chat/components/chat-panel/content/chat-messages/chat-streaming-messages";
import { ChatPanelInputForm } from "@/features/chat/components/chat-panel/content/chat-panel-input-form";
import { useChatStore } from "@/features/chat/store/chat-store";

export function ChatPanelContent() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const setLastMessageHeight = useChatStore((s) => s.setLastMessageHeight);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const SCROLL_OFFSET = 80;

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    // 스트리밍 시작 시 스크롤 로직 시작
    if (isStreaming && scrollElement) {
      setLastMessageHeight(scrollElement.clientHeight - SCROLL_OFFSET);
      requestAnimationFrame(() => {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [isStreaming, setLastMessageHeight]);

  return (
    <div className="flex h-full flex-col p-2">
      <ScrollArea className="min-h-0 flex-1 px-4" ref={scrollAreaRef}>
        <ChatMessages />
        <ChatStreamingMessages />
      </ScrollArea>
      <div className="shrink-0">
        <ChatPanelInputForm />
      </div>
    </div>
  );
}
