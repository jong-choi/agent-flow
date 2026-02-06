import type { StateCreator } from "zustand";
import {
  type ClientChatMessage,
  createAIMessage,
} from "@/features/chats/utils/chat-message";

export type ChatMessageSlice = {
  messages: ClientChatMessage[];
  appendMessage: (message: ClientChatMessage) => void;
  streamingChunkMap: Record<string, string>;
  appendStreamingChunk: ({
    nodeId,
    delta,
  }: {
    nodeId: string;
    delta: string;
  }) => void;
  initStreamingChunk: ({ nodeId }: { nodeId: string }) => void;
  resetStreamingChunkMap: () => void;
  flushStreamingToMessages: () => void;
};

export const createChatMessageSlice: StateCreator<ChatMessageSlice> = (
  set,
  get,
) => ({
  messages: [],
  appendMessage: (message: ClientChatMessage) => {
    const currentMessages = get().messages;

    message.createdAt = new Date().toISOString();
    set({
      messages: [...currentMessages, message],
    });
  },
  streamingChunkMap: {},
  appendStreamingChunk: ({
    nodeId,
    delta,
  }: {
    nodeId: string;
    delta: string;
  }) => {
    const currentStreamingMap = get().streamingChunkMap;
    const streamingChunkMap = {
      ...currentStreamingMap,
      [nodeId]: currentStreamingMap[nodeId] + delta,
    };
    set({ streamingChunkMap });
  },
  initStreamingChunk: ({ nodeId }) => {
    const currentStreamingMap = get().streamingChunkMap;
    const streamingChunkMap = {
      ...currentStreamingMap,
      [nodeId]: "",
    };
    set({ streamingChunkMap });
  },
  resetStreamingChunkMap: () => {
    set({ streamingChunkMap: {} });
  },
  flushStreamingToMessages: () => {
    const currentStreamingMap = get().streamingChunkMap;
    const appendMessage = get().appendMessage;
    const resetStreamingChunkMap = get().resetStreamingChunkMap;

    const content = Object.values(currentStreamingMap).join("\n\n");

    appendMessage(createAIMessage(content));
    resetStreamingChunkMap();
  },
});
