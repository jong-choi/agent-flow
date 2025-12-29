import { type SidebarNode } from "@/features/canvas/schema/sidebar-nodes";

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
  handle: null,
} satisfies SidebarNode;

const SearchNodeItem = {
  id: "search",
  label: "검색",
  description: "구글 검색 노드",
  type: "flowNode",
  content: null,
  handle: null,
} satisfies SidebarNode;

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
  content: null,
} satisfies SidebarNode;

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
  content: null,
} satisfies SidebarNode;

export const StartNodeItem = {
  id: "start",
  label: "시작",
  description: "시작 노드",
  type: "startNode",
  handle: {
    target: {
      count: 0,
    },
  },
  content: null,
} satisfies SidebarNode;

const EndNodeItem = {
  id: "end",
  label: "종료",
  description: "종료 노드",
  type: "endNode",
  handle: {
    source: {
      count: 0,
    },
  },
  content: null,
} satisfies SidebarNode;

export const PromptNodeItem = {
  id: "prompt",
  label: "프롬프트",
  description: "텍스트를 입력",
  type: "flowNode",
  content: {
    type: "dialog",
    label: "프롬프트 수정",
    dialogTitle: "프롬프트 입력",
    dialogDescription: "{input}으로 이전 노드의 결과물을 받을 수 있습니다",
    value: "{input}을 검색해줘",
  },
  handle: null,
} satisfies SidebarNode;

export const SIDEBAR_ITEMS: SidebarNode[] = [
  StartNodeItem,
  ChatNodeItem,
  MergeNodeItem,
  SplitNodeItem,
  SearchNodeItem,
  EndNodeItem,
  PromptNodeItem,
];
