export const documentTags = {
  allByUser: (userId: string) => `documents:user:${userId}`,
  listByUser: (userId: string) => `documents:user:${userId}:list`,
  pickerByUser: (userId: string) => `documents:user:${userId}:picker`,
  detailByUserAndDoc: (userId: string, docId: string) =>
    `documents:user:${userId}:doc:${docId}`,
} as const;
