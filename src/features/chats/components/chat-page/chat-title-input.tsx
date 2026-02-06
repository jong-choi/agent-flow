"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ChatListItem,
  type ChatListResponse,
  chatListQueryKey,
} from "@/features/chats/components/chat-page/chat-queries";
import { Input } from "@/components/ui/input";
import { updateChatTitle } from "@/features/chats/server/actions";
import { cn } from "@/lib/utils";

type ChatTitleInputProps = {
  chatId: string;
  currentTitle: string | null;
  placeholder?: string;
  onClose: () => void;
  variant?: "sidebar" | "header";
};

export function ChatTitleInput({
  chatId,
  currentTitle,
  placeholder = "이름을 입력하세요.",
  onClose,
  variant = "sidebar",
}: ChatTitleInputProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(currentTitle ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);

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
    const normalizedCurrentTitle = currentTitle?.trim() || null;

    if (nextTitle === normalizedCurrentTitle) {
      return;
    }

    const previous =
      queryClient.getQueryData<ChatListResponse>(chatListQueryKey);
    const nowIso = new Date().toISOString();

    updateCache((items) =>
      items.map((item) =>
        item.id === chatId
          ? { ...item, title: nextTitle, updatedAt: nowIso }
          : item,
      ),
    );

    try {
      await updateChatTitle({ chatId, title: nextTitle });
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

  const variantClasses =
    variant === "header"
      ? "!text-lg font-semibold text-foreground/80"
      : "text-sm font-medium text-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0";

  return (
    <Input
      ref={inputRef}
      value={value}
      placeholder={placeholder}
      data-testid="chat-title-input"
      className={cn(
        "h-auto min-h-0 border-0 bg-transparent p-0 shadow-none",
        "placeholder:text-muted-foreground/70",
        variantClasses,
      )}
      autoFocus={true}
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
