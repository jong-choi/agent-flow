import type { StateCreator } from "zustand";

export type FlowValidationSlice = {
  isValidGraph: boolean;
  setIsValidGraph: (isValidFlow: boolean) => void;
};

export const createFlowValidationSlice: StateCreator<FlowValidationSlice> = (
  set,
) => ({
  isValidGraph: false,
  setIsValidGraph: (isValidGraph) => set({ isValidGraph }),
});
