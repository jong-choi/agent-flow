import { revalidateTag } from "next/cache";
import "server-only";
import { db } from "@/db/client";
import { chatMessages } from "@/db/schema";
import { chatTags } from "@/features/chats/server/cache/tags";
import { getChatById } from "@/features/chats/server/queries";

const revalidateChatMessageTags = (userId: string, chatId: string) => {
  revalidateTag(chatTags.messagesByChat(chatId), "seconds");
  revalidateTag(chatTags.detailByChat(chatId), "seconds");
  revalidateTag(chatTags.listByUser(userId), "seconds");
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
  const chat = await getChatById(chatId);
  const [message] = await db
    .insert(chatMessages)
    .values({ chatId: chat.id, role, content })
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

  revalidateChatMessageTags(chat.userId, chat.id);

  return message;
};
