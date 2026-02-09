import { describe, expect, it } from "vitest";
import { createStore } from "zustand";
import {
  type ChatStatusSlice,
  createChatStatusSlice,
} from "@/features/chats/store/slices/chat-status-slice";

const createStatusStore = () => {
  return createStore<ChatStatusSlice>()((set, get, api) =>
    createChatStatusSlice(set, get, api),
  );
};

describe("chat-status-slice runningNodes", () => {
  it("startRunningNode는 동일 id를 중복 추가하지 않는다", () => {
    const store = createStatusStore();

    store.getState().startRunningNode({ id: "node-1", type: "searchNode" });
    store.getState().startRunningNode({ id: "node-1", type: "searchNode" });

    expect(store.getState().runningNodes).toEqual([
      { id: "node-1", type: "searchNode" },
    ]);
  });

  it("finishRunningNode는 id 기준으로 제거한다", () => {
    const store = createStatusStore();

    store.getState().startRunningNode({ id: "node-1", type: "searchNode" });
    store.getState().startRunningNode({ id: "node-2", type: "chatNode" });

    store.getState().finishRunningNode("node-1");

    expect(store.getState().runningNodes).toEqual([
      { id: "node-2", type: "chatNode" },
    ]);
  });

  it("resetRunningNodes는 모든 실행 상태를 비운다", () => {
    const store = createStatusStore();

    store.getState().startRunningNode({ id: "node-1", type: "searchNode" });
    store.getState().startRunningNode({ id: "node-2", type: "documentNode" });

    store.getState().resetRunningNodes();

    expect(store.getState().runningNodes).toEqual([]);
  });
});
