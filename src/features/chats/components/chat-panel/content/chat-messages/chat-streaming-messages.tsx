import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { ChatStreamingItem } from "@/features/chats/components/chat-panel/content/chat-messages/chat-streaming-item";
import { useChatStore } from "@/features/chats/store/chat-store";

export function ChatStreamingMessages() {
  const streamingChunkKeys = useChatStore(
    useShallow((s) => Object.keys(s.streamingChunkMap)),
  );
  const isStreaming = useChatStore((s) => s.isStreaming);

  const lastMessageHeight = useChatStore((s) => s.lastMessageHeight);
  const setLastMessageHeight = useChatStore((s) => s.setLastMessageHeight);

  const contentRef = useRef<HTMLDivElement>(null);
  const maxHeightRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) return;

    const el = contentRef.current;
    if (!el) return;

    // 스트리밍 중인 메시지의 높이가 변동될 때에 가장 높았던 값으로 업데이트
    const measureAndUpdate = () => {
      const height = Math.ceil(el.getBoundingClientRect().height);

      if (height > maxHeightRef.current) {
        maxHeightRef.current = height;
        setLastMessageHeight(height);
      }
    };

    const observer = new ResizeObserver(() => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measureAndUpdate();
      });
    });

    observer.observe(el);

    measureAndUpdate();

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isStreaming, setLastMessageHeight]);

  if (!isStreaming) return null;

  return (
    <div
      style={{
        minHeight: `${lastMessageHeight}px`, // 이 값이 "최대값"으로만 커짐
        paddingBottom: "2rem",
      }}
    >
      <div ref={contentRef}>
        {streamingChunkKeys.map((key) => (
          <ChatStreamingItem key={key} nodeId={key} />
        ))}
      </div>
    </div>
  );
}
