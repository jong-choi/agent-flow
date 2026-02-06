import "server-only";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { chatMessages, chats } from "@/db/schema";
import {
  getOwnedWorkflowById,
  getOwnedWorkflows,
  getRecentWorkflows,
  getWorkflowWithGraph,
} from "@/features/workflows/server/queries";

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
  const userId = await getUserId();

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
  const userId = await getUserId();

  const [chat] = await db
    .select({ id: chats.id, ownerId: chats.userId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  if (chat.ownerId !== userId) {
    throw new Error("채팅에 대한 접근 권한이 없습니다.");
  }

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
  const messages = await db
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

  return messages;
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
  const userId = await getUserId();

  // 1. 해당 워크플로우의 최신 채팅들을 가져오기
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

  // 2. 각 채팅별로 최초 N개의 메시지를 개별 쿼리로 가져오기
  const chatsWithMessages = await Promise.all(
    recentChats.map(async (chat) => {
      const messages = await getPublicChatMessagesByChatId({
        chatId: chat.id,
        chatLen,
      });

      return {
        ...chat,
        messages,
      };
    }),
  );

  return chatsWithMessages;
};
