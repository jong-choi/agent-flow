import type { StateCreator } from "zustand";
import { type GraphValidationMessageCode } from "@/features/canvas/constants/graph-validation-message";

export type FlowValidationSlice = {
  isValidGraph: boolean;
  setIsValidGraph: (isValidFlow: boolean) => void;
  isValidGraphMessage: GraphValidationMessageCode | null;
  setIsValidGraphMessage: (message: GraphValidationMessageCode | null) => void;
  isStartLoading: boolean;
  setIsStartLoading: (isValidFlow: boolean) => void;
};

export const createFlowValidationSlice: StateCreator<FlowValidationSlice> = (
  set,
) => ({
  isValidGraph: false,
  setIsValidGraph: (isValidGraph) => set({ isValidGraph }),
  isValidGraphMessage: null,
  setIsValidGraphMessage: (isValidGraphMessage) => set({ isValidGraphMessage }),
  isStartLoading: false,
  setIsStartLoading: (isStartLoading) => set({ isStartLoading }),
});
