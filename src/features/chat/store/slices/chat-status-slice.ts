import type { StateCreator } from "zustand";

export type ChatStatusSlice = {
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
};

export const createChatStatusSlice: StateCreator<ChatStatusSlice> = (set) => ({
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
});
