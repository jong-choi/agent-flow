import type { StateCreator } from "zustand";

export type DocumentContentSlice = {
  documentTitle: string;
  setDocumentTitle: (documentTitle: string) => void;
  documentContent: string;
  setDocumentContent: (documentContent: string | undefined) => void;
};

export const createDocumentContentSlice: StateCreator<DocumentContentSlice> = (
  set,
) => ({
  documentTitle: "",
  setDocumentTitle: (documentTitle) => {
    set({ documentTitle });
  },
  documentContent: "",
  setDocumentContent: (documentContent) => {
    set({ documentContent: documentContent ?? "" });
  },
});
