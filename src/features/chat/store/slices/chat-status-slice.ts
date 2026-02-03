import type { StateCreator } from "zustand";

export type ChatStatusSlice = {
  mode: "temporary" | "persistent";
  threadId: string | null;
  chatId: string | null;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  lastMessageHeight: number;
  setLastMessageHeight: (lastMessageHeight: number) => void;
};

export const createChatStatusSlice: StateCreator<ChatStatusSlice> = (set) => ({
  mode: "temporary",
  threadId: null,
  chatId: null,
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  lastMessageHeight: 0,
  setLastMessageHeight: (lastMessageHeight) => set({ lastMessageHeight }),
});
