"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateChatTitle } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type ChatTitleInputProps = {
  chatId: string;
  currentTitle: string | null;
  placeholder?: string;
  onClose: () => void;
  onBlur: (title: string | null) => void;
  variant?: "sidebar" | "header";
};

export function ChatTitleInput({
  chatId,
  currentTitle,
  placeholder,
  onClose,
  onBlur,
  variant = "sidebar",
}: ChatTitleInputProps) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const [value, setValue] = useState(currentTitle ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const skipCommitRef = useRef(false);
  const resolvedPlaceholder = placeholder ?? t("title.placeholder");

  const commitRename = async () => {
    onClose();
    onBlur?.(value);

    const trimmed = value.trim();
    const nextTitle = trimmed.length ? trimmed : null;
    const normalizedCurrentTitle = currentTitle?.trim() || null;

    if (nextTitle === normalizedCurrentTitle) {
      return;
    }

    try {
      await updateChatTitle({ chatId, title: nextTitle });
      toast.success(t("toast.renameSuccess"));
    } catch {
      onBlur?.(null);
      toast.error(t("toast.renameFailed"));
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
      placeholder={resolvedPlaceholder}
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
