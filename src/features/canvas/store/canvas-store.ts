"use client";

import { createStore } from "zustand";
import {
  type FlowValidationSlice,
  createFlowValidationSlice,
} from "@/features/canvas/store/slices/flow-validation-slice";

export type CanvasState = FlowValidationSlice;

export const createCanvasStore = (initialState?: Partial<CanvasState>) =>
  createStore<CanvasState>()((set, get, api) => ({
    ...createFlowValidationSlice(set, get, api),
    ...initialState,
  }));
