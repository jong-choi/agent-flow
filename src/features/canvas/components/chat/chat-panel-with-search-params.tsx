"use client";

import { useSearchParams } from "next/navigation";

export function ChatPanelWithSearchParams({
  children,
}: React.PropsWithChildren) {
  const chatId = useSearchParams().get("chat_id");
  const isRunning = Boolean(chatId);

  if (!isRunning) {
    return null;
  }

  return children;
}
