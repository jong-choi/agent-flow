"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";
import { ChatStoreProvider } from "@/features/chat/store/chat-store";

export function ChatEventWrapper({
  children,
  initialThreadId,
}: React.PropsWithChildren<{ initialThreadId?: string }>) {
  const threadSearchParams = useSearchParams().get("thread_id");
  const threadId = initialThreadId || threadSearchParams;
  const setSearchParams = useSetSearchParams();

  useEffect(() => {
    const controller = new AbortController();
    try {
      if (!threadId) return;

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
        if (threadSearchParams) {
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
  }, [setSearchParams, threadId, threadSearchParams]);

  if (!threadId) {
    return null;
  }

  return (
    <ChatStoreProvider initialState={{ threadId }}>
      {children}
    </ChatStoreProvider>
  );
}
