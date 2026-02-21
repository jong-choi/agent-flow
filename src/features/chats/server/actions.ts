"use server";

import { updateTag } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { createApiError } from "@/app/api/_errors/api-error";
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
    throw createApiError("workflowNotFound", {
      message: "Workflow not found.",
    });
  }

  const userId = await getUserId();
  if (workflowData.workflow.ownerId !== userId) {
    throw createApiError("forbidden", {
      message: "You do not have permission to access this workflow.",
    });
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
    throw createApiError("internalError", {
      message: "Failed to create chat.",
    });
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
    throw createApiError("internalError", {
      message: "Failed to update chat title.",
    });
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
    throw createApiError("internalError", {
      message: "Failed to delete chat.",
    });
  }

  updateChatTags(chat.userId, chat.id);

  return deleted;
};

export const updateChatTagsAction = async () => {
  const userId = await getUserId();
  updateChatTags(userId);
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
