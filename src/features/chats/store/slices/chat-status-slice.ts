import type { StateCreator } from "zustand";
import { type NodeType } from "@/features/canvas/constants/node-types";

type RunningNode = {
  id: string;
  type: NodeType;
};

export type ChatStatusSlice = {
  mode: "temporary" | "persistent";
  threadId: string | null;
  chatId: string | null;
  estimatedCredits: number | null;
  setEstimatedCredits: (estimatedCredits: number | null) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  runningNodes: RunningNode[];
  startRunningNode: (node: RunningNode) => void;
  finishRunningNode: (nodeId: string) => void;
  resetRunningNodes: () => void;
  lastMessageHeight: number;
  setLastMessageHeight: (lastMessageHeight: number) => void;
};

export const createChatStatusSlice: StateCreator<ChatStatusSlice> = (set) => ({
  mode: "temporary",
  threadId: null,
  chatId: null,
  estimatedCredits: null,
  setEstimatedCredits: (estimatedCredits) => set({ estimatedCredits }),
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  runningNodes: [],
  startRunningNode: (node) =>
    set((state) => {
      if (
        state.runningNodes.some((runningNode) => runningNode.id === node.id)
      ) {
        return state;
      }
      return {
        runningNodes: [...state.runningNodes, node],
      };
    }),
  finishRunningNode: (nodeId) =>
    set((state) => {
      const nextRunningNodes = state.runningNodes.filter(
        (runningNode) => runningNode.id !== nodeId,
      );

      if (nextRunningNodes.length === state.runningNodes.length) {
        return state;
      }

      return { runningNodes: nextRunningNodes };
    }),
  resetRunningNodes: () => set({ runningNodes: [] }),
  lastMessageHeight: 0,
  setLastMessageHeight: (lastMessageHeight) => set({ lastMessageHeight }),
});
