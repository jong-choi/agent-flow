import type { StateCreator } from "zustand";
import { type SidebarNodeData } from "@/db/query/sidebar-nodes";

type SidebarInfo = Omit<NonNullable<SidebarNodeData["information"]>, "id">;
export type SidebarInfoSlice = {
  selectedInfo: SidebarInfo;
  setSelectedInfo: (selectedInfo: SidebarInfo) => void;
};

const defaultInformation: SidebarInfo = {
  nodeId: "0",
  title: "노드 사용 가이드",
  summary: "사이드바의 노드를 캔버스로 드래그하여 배치합니다",
  description: "사이드바의 노드를 캔버스로 드래그하면 추가됩니다.",
  guides: [
    "노드를 드래그하여 캔버스에 배치하세요",
    "노드의 핸들을 연결하여 워크플로우를 구성하세요",
    "시작 노드에서 시작하여 종료 노드로 끝나야 합니다",
    "분할과 병합을 활용하여 복잡한 처리 흐름을 만들 수 있습니다",
  ],
};

export const createSidebarInfoSlice: StateCreator<SidebarInfoSlice> = (
  set,
) => ({
  selectedInfo: defaultInformation,
  setSelectedInfo: (selectedInfo) => set({ selectedInfo }),
});
