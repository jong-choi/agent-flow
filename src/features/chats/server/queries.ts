import { cache } from "react";
import { cacheTag } from "next/cache";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import "server-only";
import { db } from "@/db/client";
import {
  buildCursorOrderBy,
  buildCursorWhere,
  type CursorOptions,
  toCursorTimestamp,
} from "@/db/query/cursor";
import { chatMessages, chats } from "@/db/schema";
import { aiModels } from "@/db/schema/ai-models";
import { getUserId } from "@/features/auth/server/queries";
import { chatTags } from "@/features/chats/server/cache/tags";
import {
  getOwnedWorkflowById,
  getOwnedWorkflowsPage,
  getOwnedWorkflows,
  getRecentWorkflows,
  getWorkflowWithGraph,
} from "@/features/workflows/server/queries";

const normalizePositiveNumber = (
  value: number | undefined,
  fallback: number,
) => {
  const parsed = typeof value === "number" ? Math.trunc(value) : fallback;
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, parsed);
};

const getActiveAiModelsBase = async () => {
  return db
    .select()
    .from(aiModels)
    .where(eq(aiModels.isActive, true))
    .orderBy(asc(aiModels.order), desc(aiModels.createdAt));
};

const getActiveAiModelsCached = cache(async () => {
  "use cache";
  cacheTag(chatTags.activeAiModels());

  return getActiveAiModelsBase();
});

export const getActiveAiModels = async () => getActiveAiModelsCached();

export const getRecentWorkflowsForChat = async (
  params: {
    limit: number;
  } = { limit: 6 },
) => getRecentWorkflows(params);

export const getOwnedWorkflowsForChat = async () => getOwnedWorkflows();

export const getOwnedWorkflowsForChatPage = async (options?: CursorOptions) =>
  getOwnedWorkflowsPage(options);

export const getOwnedWorkflowForChatById = async (workflowId: string) =>
  getOwnedWorkflowById(workflowId);

export const getWorkflowWithGraphForChat = async (workflowId: string) =>
  getWorkflowWithGraph(workflowId);

export const getChatById = async (chatId: string) => {
  const normalizedChatId = chatId.trim();
  if (!normalizedChatId) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  const userId = await getUserId();
  return getChatByIdCached(userId, normalizedChatId);
};

const getChatByIdCached = cache(async (userId: string, chatId: string) => {
  "use cache";
  cacheTag(chatTags.listByUser(userId));
  cacheTag(chatTags.detailByChat(chatId));

  const [chat] = await db
    .select({
      id: chats.id,
      userId: chats.userId,
      workflowId: chats.workflowId,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      deletedAt: chats.deletedAt,
    })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.deletedAt || chat.userId !== userId) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  return chat;
});

export const getChatMessagesByChatId = cache(async (chatId: string) => {
  await getChatById(chatId);

  return db
    .select({
      id: chatMessages.id,
      chatId: chatMessages.chatId,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(asc(chatMessages.createdAt));
});

export const getChatsByUser = async () => {
  const userId = await getUserId();
  return getChatsByUserCached(userId);
};

const getChatsByUserCached = cache(async (userId: string) => {
  "use cache";
  cacheTag(chatTags.listByUser(userId));

  return db
    .select({
      id: chats.id,
      workflowId: chats.workflowId,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
    .orderBy(desc(chats.updatedAt));
});

export type UserChatPage = {
  items: {
    id: string;
    workflowId: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  pageInfo: {
    hasNext: boolean;
    nextCursor: string | null;
  };
};

export const getChatsByUserPage = async (
  options?: CursorOptions,
): Promise<UserChatPage> => {
  const userId = await getUserId();
  const cursor = options?.cursor?.trim() ?? "";
  const limitValue = typeof options?.limit === "number" ? options.limit : 30;
  const limit = Math.max(1, Math.min(100, Math.trunc(limitValue)));

  return getChatsByUserPageCached(userId, cursor, limit);
};

const getChatsByUserPageCached = cache(async (
  userId: string,
  cursor: string,
  limit: number,
): Promise<UserChatPage> => {
  "use cache";
  cacheTag(chatTags.listByUser(userId));

  const whereClause = and(eq(chats.userId, userId), isNull(chats.deletedAt));
  if (!whereClause) {
    return { items: [], pageInfo: { hasNext: false, nextCursor: null } };
  }

  let cursorAnchor: { id: string; updatedAt: string } | null = null;
  if (cursor) {
    const [row] = await db
      .select({
        id: chats.id,
        updatedAt: toCursorTimestamp(chats.updatedAt),
      })
      .from(chats)
      .where(and(whereClause, eq(chats.id, cursor)))
      .limit(1);
    cursorAnchor = row ?? null;
  }

  const orderBy = buildCursorOrderBy(
    [
      { value: chats.updatedAt, direction: "desc" },
      { value: chats.id, direction: "desc" },
    ],
    "next",
  );

  let listWhere = whereClause;
  if (cursorAnchor) {
    const cursorWhere = buildCursorWhere(
      [
        { value: chats.updatedAt, cursor: cursorAnchor.updatedAt, direction: "desc" },
        { value: chats.id, cursor: cursorAnchor.id, direction: "desc" },
      ],
      "next",
    );
    if (cursorWhere) {
      const mergedWhere = and(whereClause, cursorWhere);
      if (mergedWhere) {
        listWhere = mergedWhere;
      }
    }
  }

  const rows = await db
    .select({
      id: chats.id,
      workflowId: chats.workflowId,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(listWhere)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = rows.slice(0, limit);
  const nextCursor = hasNext ? items[items.length - 1]?.id ?? null : null;

  return {
    items,
    pageInfo: {
      hasNext,
      nextCursor,
    },
  };
});

export const getPublicChatMessagesByChatId = async ({
  chatId,
  chatLen = 4,
}: {
  chatId: string;
  chatLen?: number;
}) => {
  const normalizedChatId = chatId.trim();
  if (!normalizedChatId) {
    return [];
  }

  return getPublicChatMessagesByChatIdCached(
    normalizedChatId,
    normalizePositiveNumber(chatLen, 4),
  );
};

const getPublicChatMessagesByChatIdCached = cache(
  async (chatId: string, chatLen: number) => {
    "use cache";
    cacheTag(chatTags.messagesByChat(chatId));

    return db
      .select({
        id: chatMessages.id,
        chatId: chatMessages.chatId,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(chatLen);
  },
);

export const getChatsByWorkflowId = async ({
  workflowId,
  limit = 3,
  chatLen = 4,
}: {
  workflowId: string;
  limit?: number;
  chatLen?: number;
}) => {
  const normalizedWorkflowId = workflowId.trim();
  if (!normalizedWorkflowId) {
    return [];
  }

  const userId = await getUserId();
  return getChatsByWorkflowIdCached(
    normalizedWorkflowId,
    userId,
    normalizePositiveNumber(limit, 3),
    normalizePositiveNumber(chatLen, 4),
  );
};

const getChatsByWorkflowIdCached = cache(
  async (
    workflowId: string,
    userId: string,
    limit: number,
    chatLen: number,
  ) => {
    "use cache";
    cacheTag(chatTags.listByUser(userId));

    const recentChats = await db
      .select({
        id: chats.id,
        workflowId: chats.workflowId,
        title: chats.title,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      })
      .from(chats)
      .where(
        and(
          eq(chats.userId, userId),
          eq(chats.workflowId, workflowId),
          isNull(chats.deletedAt),
        ),
      )
      .orderBy(desc(chats.updatedAt))
      .limit(limit);

    recentChats.forEach((chat) => {
      cacheTag(chatTags.detailByChat(chat.id));
      cacheTag(chatTags.messagesByChat(chat.id));
    });

    const chatsWithMessages = await Promise.all(
      recentChats.map(async (chat) => {
        const messages = await getPublicChatMessagesByChatIdCached(
          chat.id,
          chatLen,
        );

        return {
          ...chat,
          messages,
        };
      }),
    );

    return chatsWithMessages;
  },
);
