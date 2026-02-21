import type { StateCreator } from "zustand";

export const CHAT_MESSAGE_QUEUE_LIMIT = 3;

export type ChatMessageQueueItem = {
  id: string;
  message: string;
};

export type ChatMessageQueueSlice = {
  messageQueue: ChatMessageQueueItem[];
  enqueueMessageQueue: (message: string) => boolean;
  removeMessageQueue: (id: string) => void;
};

export const createChatMessageQueueSlice: StateCreator<
  ChatMessageQueueSlice
> = (set, get) => ({
  messageQueue: [],
  enqueueMessageQueue: (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return false;
    }

    const currentQueue = get().messageQueue;
    if (currentQueue.length >= CHAT_MESSAGE_QUEUE_LIMIT) {
      return false;
    }

    const baseId = new Date().toISOString();
    const sameTimestampCount = currentQueue.filter((item) => {
      return item.id.startsWith(baseId);
    }).length;
    const id =
      sameTimestampCount === 0 ? baseId : `${baseId}-${sameTimestampCount + 1}`;

    set({
      messageQueue: [...currentQueue, { id, message: trimmedMessage }],
    });
    return true;
  },
  removeMessageQueue: (id: string) => {
    set((state) => ({
      messageQueue: state.messageQueue.filter((item) => item.id !== id),
    }));
  },
});
