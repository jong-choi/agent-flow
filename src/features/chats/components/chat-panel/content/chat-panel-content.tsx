"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "@/features/chats/components/chat-panel/content/chat-messages/chat-messages";
import { ChatNoMessage } from "@/features/chats/components/chat-panel/content/chat-messages/chat-no-message";
import { ChatStreamingMessages } from "@/features/chats/components/chat-panel/content/chat-messages/chat-streaming-messages";
import { ChatPanelInputForm } from "@/features/chats/components/chat-panel/content/chat-panel-input-form";
import { useChatStore } from "@/features/chats/store/chat-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const SCROLL_OFFSET = 120;
export const BOTTOM_PADDING = 30;

export function ChatPanelContent() {
  const t = useTranslations<AppMessageKeys>("Chat");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const setLastMessageHeight = useChatStore((s) => s.setLastMessageHeight);
  const isMessage = useChatStore((s) => Boolean(s.messages.length));
  const isStreaming = useChatStore((s) => s.isStreaming);

  useEffect(() => {
    if (!isMessage) return;

    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    // 최초 마운트시 바닥 스크롤
    viewport.scrollTop = viewport.scrollHeight;
  }, [isMessage]);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    // 스트리밍 시작 시 스크롤 로직 시작, 스트리밍 시작 시점은 message가 send된 순간
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
      {!isMessage && <ChatNoMessage message={t("input.noMessage")} />}
      <div className="shrink-0">
        <ChatPanelInputForm />
      </div>
    </div>
  );
}
