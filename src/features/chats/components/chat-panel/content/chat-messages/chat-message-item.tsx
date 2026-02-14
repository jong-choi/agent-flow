"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn, formatTimeToday } from "@/lib/utils";

const ContentMarkdown = dynamic(() =>
  import("@/components/markdown/content-markdown").then(
    (mod) => mod.ContentMarkdown,
  ),
);

export function ChatMessageItem({ message }: { message: ClientChatMessage }) {
  const t = useTranslations<AppMessageKeys>("Chat");

  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          message.role === "user" ? "max-w-4/5" : "w-full",
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            message.role === "user"
              ? "items-center rounded-2xl bg-secondary p-4"
              : "w-full",
          )}
        >
          <Suspense
            fallback={
              <p className="leading-relaxed whitespace-pre-wrap text-transparent">
                {message.content}
              </p>
            }
          >
            <ContentMarkdown>{message.content}</ContentMarkdown>
          </Suspense>
        </div>
        <div
          className={cn(
            "mt-4 flex items-center gap-1",
            message.role === "user" ? "justify-end" : "justify-start",
            !message.createdAt && "hidden",
          )}
        >
          <span className="text-sm text-muted-foreground">
            {!!message.createdAt && formatTimeToday(message.createdAt)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-muted-foreground"
            aria-label={t("action.copyMessageAria")}
            onClick={() => {
              void navigator.clipboard.writeText(message.content);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
