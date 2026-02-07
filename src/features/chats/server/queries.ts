import { cacheTag } from "next/cache";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import "server-only";
import { db } from "@/db/client";
import { chatMessages, chats } from "@/db/schema";
import { aiModels } from "@/db/schema/ai-models";
import { getUserId } from "@/features/auth/server/queries";
import { chatTags } from "@/features/chats/server/cache/tags";
import {
  getOwnedWorkflowById,
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
    .orderBy(desc(aiModels.createdAt));
};

const getActiveAiModelsCached = async () => {
  "use cache";
  cacheTag(chatTags.activeAiModels());

  return getActiveAiModelsBase();
};

export const getActiveAiModels = async () => getActiveAiModelsCached();

export const getRecentWorkflowsForChat = async (
  params: {
    limit: number;
  } = { limit: 6 },
) => getRecentWorkflows(params);

export const getOwnedWorkflowsForChat = async () => getOwnedWorkflows();

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

const getChatByIdCached = async (userId: string, chatId: string) => {
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

  if (!chat || chat.deletedAt) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  if (chat.userId !== userId) {
    throw new Error("채팅에 대한 접근 권한이 없습니다.");
  }

  return chat;
};

export const getChatMessagesByChatId = async (chatId: string) => {
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
};

export const getChatsByUser = async () => {
  const userId = await getUserId();
  return getChatsByUserCached(userId);
};

const getChatsByUserCached = async (userId: string) => {
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
};

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

const getPublicChatMessagesByChatIdCached = async (
  chatId: string,
  chatLen: number,
) => {
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
};

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
  return getChatsByWorkflowIdCached({
    workflowId: normalizedWorkflowId,
    userId,
    limit: normalizePositiveNumber(limit, 3),
    chatLen: normalizePositiveNumber(chatLen, 4),
  });
};

const getChatsByWorkflowIdCached = async ({
  workflowId,
  userId,
  limit,
  chatLen,
}: {
  workflowId: string;
  userId: string;
  limit: number;
  chatLen: number;
}) => {
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
};
