import type { StateCreator } from "zustand";

export type SelectedNodeSlice = {
  selectedNodeId: string | null;
  setSelectedNodeId: (selectedNodeId: string | null) => void;
  updatedAt: string | null;
  setUpdatedAt: (updatedAt: string) => void;
  isCreatingDocument: boolean;
  setIsCreatingDocument: (isCreatingDocument: boolean) => void;
};

export const createSelectedNodeSlice: StateCreator<SelectedNodeSlice> = (
  set,
) => ({
  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => {
    set({ selectedNodeId });
  },
  updatedAt: null,
  setUpdatedAt: (updatedAt) => set({ updatedAt }),
  isCreatingDocument: false,
  setIsCreatingDocument: (isCreatingDocument) => {
    set({ isCreatingDocument });
  },
});
