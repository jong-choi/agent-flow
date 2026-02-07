"use server";

import { updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { getUserId } from "@/db/query/auth";
import { chatMessages, chats } from "@/db/schema";
import { chatTags } from "@/features/chats/server/cache/tags";
import {
  getChatById,
  getWorkflowWithGraphForChat,
} from "@/features/chats/server/queries";

const updateChatTags = (userId: string, chatId?: string) => {
  updateTag(chatTags.listByUser(userId));

  if (chatId) {
    updateTag(chatTags.detailByChat(chatId));
    updateTag(chatTags.messagesByChat(chatId));
  }
};

export const createChatFromWorkflow = async ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const workflowData = await getWorkflowWithGraphForChat(workflowId);
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

  updateChatTags(userId, chat.chatId);

  return chat;
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
  const chat = await getChatById(chatId);

  const [updated] = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(eq(chats.id, chat.id))
    .returning({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt,
    });

  if (!updated) {
    throw new Error("채팅 이름 변경에 실패했습니다.");
  }

  updateChatTags(chat.userId, chat.id);

  return updated;
};

export const softDeleteChat = async ({ chatId }: { chatId: string }) => {
  const chat = await getChatById(chatId);
  const now = new Date();

  const [deleted] = await db
    .update(chats)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(chats.id, chat.id))
    .returning({ id: chats.id });

  if (!deleted) {
    throw new Error("채팅 삭제에 실패했습니다.");
  }

  updateChatTags(chat.userId, chat.id);

  return deleted;
};
