"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChatStoreProvider } from "@/features/chats/store/chat-store";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { type AppMessageKeys } from "@/lib/i18n/messages";

type ChatEventWrapperMode = "temporary" | "persistent";

export function ChatEventWrapper({
  children,
  initialThreadId,
  initialChatId,
  initialMessages,
  estimatedCredits,
  mode = "temporary",
  onInvalidThredId,
}: React.PropsWithChildren<{
  initialThreadId?: string;
  initialChatId?: string;
  initialMessages?: ClientChatMessage[];
  estimatedCredits?: number | null;
  mode?: ChatEventWrapperMode;
  onInvalidThredId?: () => void;
}>) {
  const t = useTranslations<AppMessageKeys>("Chat");

  let threadId = initialThreadId ?? null;
  let chatId: string | null = null;

  if (mode === "persistent") {
    threadId = null;
    chatId = initialChatId ?? null;
  }
  useEffect(() => {
    const controller = new AbortController();
    if (mode !== "temporary" || !threadId) {
      return;
    }

    const checkThreadHealth = async () => {
      try {
        const response = await fetch(`/api/chat/temporary/${threadId}/health`, {
          signal: controller.signal,
        });

        if (response.ok) {
          return;
        }

        if (response.status === 400) {
          toast.error(t("toast.startGraphNotFound"));
        } else if (response.status === 404) {
          toast.error(t("toast.startSessionNotFound"));
        }
        onInvalidThredId?.();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        throw error;
      }
    };

    void checkThreadHealth();

    return () => {
      controller.abort();
    };
  }, [mode, onInvalidThredId, t, threadId]);

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
