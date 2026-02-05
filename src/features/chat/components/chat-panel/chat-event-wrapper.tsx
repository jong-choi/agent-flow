"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { ChatStoreProvider } from "@/features/chat/store/chat-store";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";

type ChatEventWrapperMode = "temporary" | "persistent";

export function ChatEventWrapper({
  children,
  initialThreadId,
  initialChatId,
  initialMessages,
  estimatedCredits,
  mode = "temporary",
}: React.PropsWithChildren<{
  initialThreadId?: string;
  initialChatId?: string;
  initialMessages?: ClientChatMessage[];
  estimatedCredits?: number | null;
  mode?: ChatEventWrapperMode;
}>) {
  const threadSearchParam = useSearchParams().get("thread_id");

  let threadId = initialThreadId ?? threadSearchParam;
  let chatId: string | null = null;

  if (mode === "persistent") {
    threadId = null;
    chatId = initialChatId ?? null;
  }
  const setSearchParams = useSetSearchParams();

  useEffect(() => {
    const controller = new AbortController();
    try {
      if (mode !== "temporary" || !threadId) return;

      (async () => {
        const response = await fetch(`/api/chat/temporary/${threadId}/health`, {
          signal: controller.signal,
        });

        if (response.ok) {
          return;
        }

        if (response.status === 400) {
          toast.error("채팅 시작 중 오류 : 그래프를 찾을 수 없습니다.");
        } else if (response.status === 404) {
          toast.error("채팅 시작 중 오류 : 세션을 찾을 수 없습니다.");
        }
        if (threadSearchParam) {
          setSearchParams({ thread_id: null });
        }
      })();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      throw error;
    }

    return () => {
      controller.abort();
    };
  }, [mode, setSearchParams, threadId, threadSearchParam]);

  if (mode === "temporary" && !threadId) {
    return null;
  }

  if (mode === "persistent" && !chatId) {
    return null;
  }

  const initialState = {
    mode,
    threadId,
    chatId,
    estimatedCredits: estimatedCredits ?? null,
    messages: initialMessages ?? [],
  };

  return (
    <ChatStoreProvider initialState={initialState}>
      {children}
    </ChatStoreProvider>
  );
}
