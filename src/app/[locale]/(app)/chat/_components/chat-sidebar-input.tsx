"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ChatListItem,
  type ChatListResponse,
  chatListQueryKey,
} from "@/app/[locale]/(app)/chat/_components/chat-queries";
import { Input } from "@/components/ui/input";
import { updateChatTitle } from "@/db/query/chat";

type ChatSidebarInputProps = {
  chat: ChatListItem;
  onClose: () => void;
};

export function ChatSidebarInput({ chat, onClose }: ChatSidebarInputProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(chat.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const updateCache = (updater: (items: ChatListItem[]) => ChatListItem[]) => {
    queryClient.setQueryData<ChatListResponse>(chatListQueryKey, (old) => {
      if (!old) return old;
      return { ...old, data: updater(old.data) };
    });
  };

  const commitRename = async () => {
    onClose();

    const trimmed = value.trim();
    const nextTitle = trimmed.length ? trimmed : null;
    const currentTitle = chat.title?.trim() || null;

    if (nextTitle === currentTitle) {
      return;
    }

    const previous =
      queryClient.getQueryData<ChatListResponse>(chatListQueryKey);
    const nowIso = new Date().toISOString();

    updateCache((items) =>
      items.map((item) =>
        item.id === chat.id
          ? { ...item, title: nextTitle, updatedAt: nowIso }
          : item,
      ),
    );

    try {
      await updateChatTitle({ chatId: chat.id, title: nextTitle });
      toast.success("채팅 이름을 변경했어요.");
    } catch (error) {
      if (previous) {
        queryClient.setQueryData(chatListQueryKey, previous);
      }
      const message =
        error instanceof Error
          ? error.message
          : "채팅 이름 변경에 실패했습니다.";
      toast.error(message);
    }
  };

  const handleBlur = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false;
      return;
    }
    void commitRename();
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      placeholder={"이름을 입력하세요."}
      className="h-8 text-sm"
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          inputRef.current?.blur();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          skipCommitRef.current = true;
          onClose();
          inputRef.current?.blur();
        }
      }}
    />
  );
}
