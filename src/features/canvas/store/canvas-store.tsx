"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand";
import {
  type ChatThreadSlice,
  createChatThreadSlice,
} from "@/features/canvas/store/slices/chat-thread-slice";
import {
  type FlowValidationSlice,
  createFlowValidationSlice,
} from "@/features/canvas/store/slices/flow-validation-slice";
import {
  type SelectedNodeSlice,
  createSelectedNodeSlice,
} from "@/features/canvas/store/slices/selected-node-slice";
import {
  type SidebarInfoSlice,
  createSidebarInfoSlice,
} from "@/features/canvas/store/slices/sidebar-info-slice";
import {
  type WorkflowSlice,
  createWorkflowSlice,
} from "@/features/canvas/store/slices/workflow-slice";

type CanvasState = FlowValidationSlice &
  SidebarInfoSlice &
  SelectedNodeSlice &
  WorkflowSlice &
  ChatThreadSlice;

const createCanvasStore = (initialState?: Partial<CanvasState>) =>
  createStore<CanvasState>()((set, get, api) => ({
    ...createFlowValidationSlice(set, get, api),
    ...createSidebarInfoSlice(set, get, api),
    ...createSelectedNodeSlice(set, get, api),
    ...createWorkflowSlice(set, get, api),
    ...createChatThreadSlice(set, get, api),
    ...initialState,
  }));

type CanvasStoreApi = ReturnType<typeof createCanvasStore>;

const CanvasStoreContext = createContext<CanvasStoreApi | undefined>(undefined);

interface CanvasStoreProviderProps {
  children: ReactNode;
}

export const CanvasStoreProvider = ({ children }: CanvasStoreProviderProps) => {
  const [store] = useState(() => createCanvasStore());
  return (
    <CanvasStoreContext.Provider value={store}>
      {children}
    </CanvasStoreContext.Provider>
  );
};

export const useCanvasStore = <T,>(selector: (store: CanvasState) => T): T => {
  const canvasStoreContext = useContext(CanvasStoreContext);
  if (!canvasStoreContext) {
    throw new Error(`useCanvasStore must be used within CanvasStoreProvider`);
  }

  return useStore(canvasStoreContext, selector);
};
