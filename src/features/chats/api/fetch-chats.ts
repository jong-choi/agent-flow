import { type ChatListResponse } from "@/features/chats/components/chat-page/chat-queries";

export const fetchChats = async (): Promise<ChatListResponse> => {
  const response = await fetch("/api/chat/persistent");

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "채팅 목록을 불러오지 못했습니다.";
    throw new Error(message);
  }

  return response.json();
};
