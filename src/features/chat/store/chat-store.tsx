"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand";
import {
  type ChatMessageSlice,
  createChatMessageSlice,
} from "@/features/chat/store/slices/chat-message-slice";
import {
  type ChatStatusSlice,
  createChatStatusSlice,
} from "@/features/chat/store/slices/chat-status-slice";

type ChatState = ChatMessageSlice & ChatStatusSlice;

const createChatStore = (initialState?: Partial<ChatState>) =>
  createStore<ChatState>()((set, get, api) => ({
    ...createChatMessageSlice(set, get, api),
    ...createChatStatusSlice(set, get, api),
    ...initialState,
  }));

type ChatStoreApi = ReturnType<typeof createChatStore>;

const ChatStoreContext = createContext<ChatStoreApi | undefined>(undefined);

interface ChatStoreProviderProps {
  children: ReactNode;
}

export const ChatStoreProvider = ({ children }: ChatStoreProviderProps) => {
  const [store] = useState(() => createChatStore());
  return (
    <ChatStoreContext.Provider value={store}>
      {children}
    </ChatStoreContext.Provider>
  );
};

export const useChatStore = <T,>(selector: (store: ChatState) => T): T => {
  const chatStoreContext = useContext(ChatStoreContext);
  if (!chatStoreContext) {
    throw new Error(`useChatStore must be used within ChatStoreProvider`);
  }

  return useStore(chatStoreContext, selector);
};
