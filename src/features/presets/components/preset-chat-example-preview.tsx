"use client";

import { useTranslations } from "next-intl";
import { ContentMarkdown } from "@/components/markdown/content-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export function PresetChatExamplePreview({
  messages,
}: {
  messages: ClientChatMessage[];
}) {
  const t = useTranslations<AppMessageKeys>("Presets");

  return (
    <div className="h-[600px] rounded-lg border bg-muted/20">
      <ScrollArea className="h-full p-8">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "space-y-1 rounded-xl border px-3 py-2 text-sm shadow-sm",
                  message.role === "assistant" ? "w-full" : "max-w-[75%]",
                  message.role === "user" && "bg-primary/10",
                  message.role === "assistant" && "bg-background",
                )}
              >
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  {message.role === "user"
                    ? t("chatExamplePreview.userRole")
                    : message.role === "assistant"
                      ? t("chatExamplePreview.assistantRole")
                      : message.role}
                </p>
                <ContentMarkdown className="px-4 py-2 !text-sm !leading-relaxed">
                  {message.content}
                </ContentMarkdown>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
