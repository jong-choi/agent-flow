"use server";

import { updateTag } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { type CursorOptions } from "@/db/query/cursor";
import { chats } from "@/db/schema";
import { getUserId } from "@/features/auth/server/queries";
import { chatTags } from "@/features/chats/server/cache/tags";
import {
  getChatById,
  getChatsByUserPage,
  getOwnedWorkflowsForChatPage,
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
    .returning({
      id: chats.id,
      workflowId: chats.workflowId,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    });

  if (!chat) {
    throw new Error("채팅 생성에 실패했습니다.");
  }

  updateChatTags(userId, chat.id);

  return chat;
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

export const updateChatTitleIfMissing = async ({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) => {
  const chat = await getChatById(chatId);
  if (chat.title?.trim()) {
    return null;
  }

  const [updated] = await db
    .update(chats)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(chats.id, chat.id), isNull(chats.title)))
    .returning({
      id: chats.id,
      title: chats.title,
      updatedAt: chats.updatedAt,
    });

  if (!updated) {
    return null;
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

export const getChatsByUserPageAction = async (options?: CursorOptions) =>
  getChatsByUserPage(options);

export const getOwnedWorkflowsForChatPageAction = async (
  options?: CursorOptions,
) => getOwnedWorkflowsForChatPage(options);

export const getWorkflowWithGraphForChatAction = async ({
  workflowId,
}: {
  workflowId: string;
}) => getWorkflowWithGraphForChat(workflowId);
