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

const NEAR_BOTTOM = 80; // 바닥 근처 판정 px

export function ChatPanelContent() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

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

    // 유저가 바닥 근처면 자동 스크롤 유지, 위로 올리면 해제
    const onScroll = () => {
      const distanceToBottom =
        viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
      isAutoScrollRef.current = distanceToBottom <= NEAR_BOTTOM;
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => viewport.removeEventListener("scroll", onScroll);
  }, [isMessage]);

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

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const content = viewport.firstElementChild as HTMLElement | null;
    if (!content) return;

    // 스트리밍으로 메시지 높이가 계속 변하는 걸 감지해서, 바닥 근처면 계속 아래로 붙임
    const ro = new ResizeObserver(() => {
      if (!isAutoScrollRef.current) return;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "smooth",
      });
    });

    ro.observe(content);
    return () => ro.disconnect();
  }, [isStreaming]);

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
