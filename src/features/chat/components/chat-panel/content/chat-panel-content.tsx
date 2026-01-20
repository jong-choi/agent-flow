"use client";

import { ChatPanelInputForm } from "@/features/chat/components/chat-panel/content/chat-panel-input-form";
import { ChatPanelMessages } from "@/features/chat/components/chat-panel/content/chat-panel-messges/chat-panel-messages";
import { ChatPanelStreaming } from "@/features/chat/components/chat-panel/content/chat-panel-streaming/chat-panel-streaming";

export function ChatPanelContent() {
  return (
    <div>
      <ChatPanelMessages />
      <ChatPanelStreaming />
      <ChatPanelInputForm />
    </div>
  );
}
