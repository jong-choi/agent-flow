import type { StateCreator } from "zustand";

export type ChatThreadSlice = {
  threadId: string | null;
  setThreadId: (threadId: string | null) => void;
};

export const createChatThreadSlice: StateCreator<ChatThreadSlice> = (set) => ({
  threadId: null,
  setThreadId: (threadId) => set({ threadId }),
});
