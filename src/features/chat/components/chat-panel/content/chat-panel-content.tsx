"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessages } from "@/features/chat/components/chat-panel/content/chat-messages/chat-messages";
import { ChatStreamingMessages } from "@/features/chat/components/chat-panel/content/chat-messages/chat-streaming-messages";
import { ChatPanelInputForm } from "@/features/chat/components/chat-panel/content/chat-panel-input-form";

export function ChatPanelContent() {
  return (
    <div className="flex h-full flex-col p-2">
      <ScrollArea className="min-h-0 flex-1">
        <ChatMessages />
        <ChatStreamingMessages />
      </ScrollArea>
      <div className="shrink-0">
        <ChatPanelInputForm />
      </div>
    </div>
  );
}
