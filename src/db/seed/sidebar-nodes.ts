import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  type SidebarNodeContentInsert,
  type SidebarNodeHandleInsert,
  type SidebarNodeInsert,
  sidebarNodeContents,
  sidebarNodeHandles,
  sidebarNodes,
} from "@/db/schema";

type SidebarNodeSeedItem = {
  label: string;
  description: string;
  type: string;
  content: null | {
    type: "select" | "dialog";
    label: string;
    placeholder?: string;
    value?: string;
    optionsSource?: "ai_models";
    dialogTitle?: string;
    dialogDescription?: string;
  };
  handle: null | {
    target?: { count: number };
    source?: { count: number };
  };
};

const ChatNodeItem: SidebarNodeSeedItem = {
  label: "채팅",
  description: "응답 생성 노드",
  type: "flowNode",
  content: {
    type: "select",
    label: "Agent",
    placeholder: "Agent를 선택하기",
    optionsSource: "ai_models",
  },
  handle: null,
};

const SearchNodeItem = {
  label: "검색",
  description: "구글 검색 노드",
  type: "flowNode",
  content: null,
  handle: null,
};

const MergeNodeItem = {
  label: "병합",
  description: "여러 입력을 하나로 병합",
  type: "flowNode",
  handle: {
    target: {
      count: 3,
    },
  },
  content: null,
};

const SplitNodeItem = {
  label: "분할",
  description: "입력을 여러 출력으로 분할",
  type: "flowNode",
  handle: {
    source: {
      count: 3,
    },
  },
  content: null,
};
export const StartNodeItem = {
  label: "시작",
  description: "시작 노드",
  type: "startNode",
  handle: {
    target: {
      count: 0,
    },
  },
  content: null,
};

const EndNodeItem = {
  label: "종료",
  description: "종료 노드",
  type: "endNode",
  handle: {
    source: {
      count: 0,
    },
  },
  content: null,
};

export const PromptNodeItem: SidebarNodeSeedItem = {
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
};

const sidebarNodesData: SidebarNodeSeedItem[] = [
  StartNodeItem,
  ChatNodeItem,
  MergeNodeItem,
  SplitNodeItem,
  SearchNodeItem,
  EndNodeItem,
  PromptNodeItem,
];

export const seedSidebarNodes = async () => {
  await db.transaction(async (tx) => {
    for (const raw of sidebarNodesData) {
      const { type, label, description } = raw;
      const nodeUpsert: SidebarNodeInsert = {
        type,
        label,
        description,
      };

      const [node] = await tx
        .insert(sidebarNodes)
        .values(nodeUpsert)
        .onConflictDoUpdate({
          target: sidebarNodes.label,
          set: {
            type,
            description,
          },
        })
        .returning({ id: sidebarNodes.id });

      const nodeId = node.id;

      if (raw.content === null) {
        await tx
          .delete(sidebarNodeContents)
          .where(eq(sidebarNodeContents.nodeId, nodeId));
      } else {
        const content = raw.content;
        const contentInsert: SidebarNodeContentInsert = { nodeId, ...content };

        await tx
          .insert(sidebarNodeContents)
          .values(contentInsert)
          .onConflictDoUpdate({
            target: sidebarNodeContents.nodeId,
            set: content,
          });
      }

      if (raw.handle === null) {
        await tx
          .delete(sidebarNodeHandles)
          .where(eq(sidebarNodeHandles.nodeId, nodeId));
      } else {
        const handle = raw.handle;

        const handleInsert: SidebarNodeHandleInsert = {
          nodeId,
          targetCount: handle.target?.count,
          sourceCount: handle.source?.count,
        };

        await tx
          .insert(sidebarNodeHandles)
          .values(handleInsert)
          .onConflictDoUpdate({
            target: sidebarNodeHandles.nodeId,
            set: {
              targetCount: handleInsert.targetCount,
              sourceCount: handleInsert.sourceCount,
            },
          });
      }
    }
  });
};
