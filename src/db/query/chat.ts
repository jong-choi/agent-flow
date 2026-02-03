"use server";

import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { getWorkflowWithGraph } from "@/db/query/workflows";
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
