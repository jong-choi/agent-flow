export const creditTags = {
  allByUser: (userId: string) => `credits:user:${userId}:all`,
  balanceByUser: (userId: string) => `credits:user:${userId}:balance`,
  summaryByUser: (userId: string) => `credits:user:${userId}:summary`,
  historyByUser: (userId: string) => `credits:user:${userId}:history`,
  attendanceByUser: (userId: string) => `credits:user:${userId}:attendance`,
} as const;
