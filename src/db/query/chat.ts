"use server";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { getWorkflowWithGraph } from "@/features/workflows/server/queries";
import { chatMessages, chats } from "@/db/schema";

export const createChatFromWorkflow = async ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const workflowData = await getWorkflowWithGraph(workflowId);
  if (!workflowData) {
    throw new Error("워크플로우를 찾을 수 없습니다.");
  }
  const userId = await getUserId();
  if (workflowData.workflow.ownerId !== userId) {
    throw new Error("워크플로우에 대한 접근 권한이 없습니다.");
  }

  const [chat] = await db
    .insert(chats)
    .values({ userId, workflowId })
    .returning({ chatId: chats.id });

  if (!chat?.chatId) {
    throw new Error("채팅 생성에 실패했습니다.");
  }

  return chat;
};

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

export const insertChatMessage = async ({
  chatId,
  role,
  content,
}: {
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
}) => {
  const [message] = await db
    .insert(chatMessages)
    .values({ chatId, role, content })
    .returning({
      id: chatMessages.id,
      chatId: chatMessages.chatId,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    });

  if (!message) {
    throw new Error("메시지 저장에 실패했습니다.");
  }

  return message;
};

export const updateChatTitle = async ({
  chatId,
  title,
}: {
  chatId: string;
  title: string | null;
}) => {
  const userId = await getUserId();

  const [chat] = await db
    .select({ id: chats.id, userId: chats.userId, deletedAt: chats.deletedAt })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.deletedAt) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  if (chat.userId !== userId) {
    throw new Error("채팅에 대한 접근 권한이 없습니다.");
  }

  const [updated] = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(eq(chats.id, chatId))
    .returning({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt,
    });

  if (!updated) {
    throw new Error("채팅 이름 변경에 실패했습니다.");
  }

  return updated;
};

export const softDeleteChat = async ({ chatId }: { chatId: string }) => {
  const userId = await getUserId();

  const [chat] = await db
    .select({ id: chats.id, userId: chats.userId, deletedAt: chats.deletedAt })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.deletedAt) {
    throw new Error("채팅을 찾을 수 없습니다.");
  }

  if (chat.userId !== userId) {
    throw new Error("채팅에 대한 접근 권한이 없습니다.");
  }

  const now = new Date();
  const [deleted] = await db
    .update(chats)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(chats.id, chatId))
    .returning({ id: chats.id });

  if (!deleted) {
    throw new Error("채팅 삭제에 실패했습니다.");
  }

  return deleted;
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
