"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { PresetChatExamplePreview } from "@/features/presets/components/preset-chat-example-preview";
import { cn } from "@/lib/utils";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export type ChatExample = {
  id: string;
  title: string | null;
  messages: ClientChatMessage[];
};

type PresetChatExampleOptionsProps = {
  chats: ChatExample[];
  pinnedChat?: ChatExample | null;
  defaultSelectedId?: string | null;
};

export function PresetChatExampleOptions({
  chats,
  pinnedChat = null,
  defaultSelectedId = null,
}: PresetChatExampleOptionsProps) {
  const t = useTranslations<AppMessageKeys>("Presets");
  const deduped = chats.filter((chat) => chat.id !== pinnedChat?.id);
  const chatOptions = pinnedChat ? [pinnedChat, ...deduped] : deduped;

  const [selectedId, setSelectedId] = useState<string>(defaultSelectedId || "");

  const selectedChat =
    chatOptions.find((chat) => chat.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <input type="hidden" name="chatId" value={selectedId} />
      <div className="flex flex-wrap gap-3">
        <ChatExampleOptionCard
          label={t("chatExampleCard.noneOption")}
          messageCountLabel={t("chatExampleCard.messageCount", { count: 0 })}
          selected={!selectedId || selectedId === ""}
          onSelect={() => setSelectedId("")}
        />
        {chatOptions.map((chat, index) => (
          <ChatExampleOptionCard
            key={chat.id}
            label={
              chat.title ||
              t("chatExampleCard.chatFallbackLabel", { index: index + 1 })
            }
            messageCountLabel={t("chatExampleCard.messageCount", {
              count: chat.messages.length,
            })}
            selected={selectedId === chat.id}
            onSelect={() => setSelectedId(chat.id)}
          />
        ))}
      </div>
      <PresetChatExamplePreview messages={selectedChat?.messages ?? []} />
    </div>
  );
}

type ChatExampleOptionCardProps = {
  label: string;
  messageCountLabel: string;
  selected: boolean;
  onSelect: () => void;
};

function ChatExampleOptionCard({
  label,
  messageCountLabel,
  selected,
  onSelect,
}: ChatExampleOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-full flex-1 flex-col gap-2 rounded-lg border bg-background/40 p-3 text-left transition",
        "hover:border-primary/50 hover:bg-background/70",
        selected && "border-primary ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-semibold">{label}</span>
        <span>{messageCountLabel}</span>
      </div>
    </button>
  );
}
