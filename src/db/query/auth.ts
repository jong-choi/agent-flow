"use server";

import { auth } from "@/lib/auth";

export const getUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("사용자 정보가 없습니다.");
  }
  return userId;
};
