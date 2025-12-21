import { type SidebarItem } from "@/features/canvas/types/sidebar-item";

const ChatNodeItem = {
  id: "chat",
  label: "채팅",
  description: "응답 생성 노드",
  type: "flowNode",
  content: {
    type: "select",
    label: "Agent",
    placeholder: "Agent를 선택하기",
    options: ["gemma-3-3b", "gemma-3-30b", "gemma-3-300b"],
  },
} satisfies SidebarItem;

const SearchNodeItem = {
  id: "search",
  label: "검색",
  description: "구글 검색 노드",
  type: "flowNode",
} satisfies SidebarItem;

const MergeNodeItem = {
  id: "merge",
  label: "병합",
  description: "여러 입력을 하나로 병합",
  type: "flowNode",
  handle: {
    target: {
      count: 3,
    },
  },
} satisfies SidebarItem;

const SplitNodeItem = {
  id: "split",
  label: "분할",
  description: "입력을 여러 출력으로 분할",
  type: "flowNode",
  handle: {
    source: {
      count: 3,
    },
  },
} satisfies SidebarItem;

export const StartNodeItem = {
  id: "start",
  label: "시작",
  description: "시작 노드",
  type: "flowNode",
  handle: {
    target: {
      count: 0,
    },
  },
} satisfies SidebarItem;

const EndNodeItem = {
  id: "end",
  label: "종료",
  description: "종료 노드",
  type: "flowNode",
  handle: {
    source: {
      count: 0,
    },
  },
} satisfies SidebarItem;

export const SIDEBAR_ITEMS: SidebarItem[] = [
  StartNodeItem,
  ChatNodeItem,
  MergeNodeItem,
  SplitNodeItem,
  SearchNodeItem,
  EndNodeItem,
];
