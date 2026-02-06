"use client";

import { type ReactNode, createContext, useContext, useState } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand";
import {
  type DocumentContentSlice,
  createDocumentContentSlice,
} from "@/features/documents/store/slices/document-content-slice";

type DocumentState = DocumentContentSlice;

const createDocumentStore = (initialState?: Partial<DocumentState>) =>
  createStore<DocumentState>()((set, get, api) => ({
    ...createDocumentContentSlice(set, get, api),
    ...initialState,
  }));

type DocumentStoreApi = ReturnType<typeof createDocumentStore>;

const DocumentStoreContext = createContext<DocumentStoreApi | undefined>(
  undefined,
);

interface DocumentStoreProviderProps {
  children: ReactNode;
  initialValue?: Partial<DocumentState>;
}

export const DocumentStoreProvider = ({
  children,
  initialValue,
}: DocumentStoreProviderProps) => {
  const [store] = useState(() => createDocumentStore(initialValue));
  return (
    <DocumentStoreContext.Provider value={store}>
      {children}
    </DocumentStoreContext.Provider>
  );
};

export const useDocumentStore = <T,>(
  selector: (store: DocumentState) => T,
): T => {
  const documentStoreContext = useContext(DocumentStoreContext);
  if (!documentStoreContext) {
    throw new Error(
      `useDocumentStore must be used within DocumentStoreProvider`,
    );
  }

  return useStore(documentStoreContext, selector);
};
