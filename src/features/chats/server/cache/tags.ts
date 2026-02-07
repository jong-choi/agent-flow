export const chatTags = {
  listByUser: (userId: string) => `chats:user:${userId}:list`,
  detailByChat: (chatId: string) => `chats:${chatId}:detail`,
  messagesByChat: (chatId: string) => `chats:${chatId}:messages`,
} as const;
