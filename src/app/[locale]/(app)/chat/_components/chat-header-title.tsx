"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchChats } from "@/app/[locale]/(app)/chat/_api/fetch-chats";
import { chatListQueryKey } from "@/app/[locale]/(app)/chat/_components/chat-queries";
import { formatKoreanDate } from "@/lib/utils";

type ChatHeaderTitleProps = {
  chatId: string;
  initialTitle: string;
};

export function ChatHeaderTitle({
  chatId,
  initialTitle,
}: ChatHeaderTitleProps) {
  const { data: chat } = useQuery({
    queryKey: chatListQueryKey,
    queryFn: fetchChats,
    select: (res) => res.data.find((item) => item.id === chatId),
  });

  const resolvedTitle = chat
    ? chat.title?.trim() || formatKoreanDate(chat.createdAt)
    : null;

  return (
    <div className="truncate text-lg font-semibold text-foreground">
      {resolvedTitle ?? initialTitle}
    </div>
  );
}
