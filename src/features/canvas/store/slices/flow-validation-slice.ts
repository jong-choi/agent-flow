import type { StateCreator } from "zustand";

export type FlowValidationSlice = {
  isValidGraph: boolean;
  setIsValidGraph: (isValidFlow: boolean) => void;
  isStartLoading: boolean;
  setIsStartLoading: (isValidFlow: boolean) => void;
};

export const createFlowValidationSlice: StateCreator<FlowValidationSlice> = (
  set,
) => ({
  isValidGraph: false,
  setIsValidGraph: (isValidGraph) => set({ isValidGraph }),
  isStartLoading: false,
  setIsStartLoading: (isStartLoading) => set({ isStartLoading }),
});
