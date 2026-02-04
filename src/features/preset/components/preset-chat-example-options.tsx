"use client";

import { useMemo, useState } from "react";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";
import { PresetChatExamplePreview } from "@/features/preset/components/preset-chat-example-preview";
import { cn } from "@/lib/utils";

type ChatExample = {
  id: string;
  title: string | null;
  messages: ClientChatMessage[];
};

type PresetChatExampleOptionsProps = {
  chats: ChatExample[];
};

const MAX_CHAT_OPTIONS = 3;
const NO_SELECTION = "";

export function PresetChatExampleOptions({
  chats,
}: PresetChatExampleOptionsProps) {
  const chatOptions = chats.slice(0, MAX_CHAT_OPTIONS);
  const [selectedId, setSelectedId] = useState<string>(NO_SELECTION);
  const selectedChat = useMemo(
    () => chatOptions.find((chat) => chat.id === selectedId) ?? null,
    [chatOptions, selectedId],
  );

  return (
    <div className="space-y-4">
      <input type="hidden" name="chatId" value={selectedId} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ChatExampleOptionCard
          label="선택 안함"
          count={0}
          selected={selectedId === NO_SELECTION}
          onSelect={() => setSelectedId(NO_SELECTION)}
        />
        {chatOptions.map((chat, index) => (
          <ChatExampleOptionCard
            key={chat.id}
            label={chat.title || `채팅 ${index + 1}`}
            count={chat.messages.length}
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
  count: number;
  selected: boolean;
  onSelect: () => void;
};

function ChatExampleOptionCard({
  label,
  count,
  selected,
  onSelect,
}: ChatExampleOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex h-full flex-col gap-2 rounded-lg border bg-background/40 p-3 text-left transition",
        "hover:border-primary/50 hover:bg-background/70",
        selected && "border-primary ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-semibold">{label}</span>
        <span>{`메시지 ${count}개`}</span>
      </div>
    </button>
  );
}
