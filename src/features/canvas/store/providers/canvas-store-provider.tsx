"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import {
  type CanvasState,
  createCanvasStore,
} from "@/features/canvas/store/canvas-store";

export type CanvasStoreApi = ReturnType<typeof createCanvasStore>;

export const CanvasStoreContext = createContext<CanvasStoreApi | undefined>(
  undefined,
);

export interface CanvasStoreProviderProps {
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
