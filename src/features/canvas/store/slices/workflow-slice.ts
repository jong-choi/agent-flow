import { type StateCreator } from "zustand";

export type WorkflowState = {
  id: string;
  title: string;
  description: string | null;
};

export const defaultWorkflowState: WorkflowState = {
  id: "",
  title: "",
  description: "",
};

export type WorkflowSlice = {
  workflow: WorkflowState | null;
  setWorkflow: (workflow: WorkflowState | null) => void;
};

export const createWorkflowSlice: StateCreator<WorkflowSlice> = (set) => ({
  workflow: defaultWorkflowState,
  setWorkflow: (workflow) => {
    set({ workflow });
  },
});
