import type { StateCreator } from "zustand";

export type SelectedNodeSlice = {
  selectedNodeId: string | null;
  setSelectedNodeId: (selectedNodeId: string | null) => void;
};

export const createSelectedNodeSlice: StateCreator<SelectedNodeSlice> = (
  set,
) => ({
  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => {
    set({ selectedNodeId });
  },
});
