import type { StateCreator } from "zustand";

export type ChatStatusSlice = {
  threadId: string | null;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  lastMessageHeight: number;
  setLastMessageHeight: (lastMessageHeight: number) => void;
};

export const createChatStatusSlice: StateCreator<ChatStatusSlice> = (set) => ({
  threadId: null,
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  lastMessageHeight: 0,
  setLastMessageHeight: (lastMessageHeight) => set({ lastMessageHeight }),
});
