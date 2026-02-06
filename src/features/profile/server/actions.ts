"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isDisplayNameTaken } from "@/features/profile/server/queries";

export const checkDisplayNameTakenAction = async (
  displayName: string,
  excludeUserId?: string,
) => {
  const trimmedDisplayName = displayName.trim();
  if (!trimmedDisplayName) {
    return false;
  }

  return isDisplayNameTaken(trimmedDisplayName, excludeUserId);
};

export const updateUserAction = async (formData: FormData) => {
  const rawDisplayName = formData.get("displayName");
  if (typeof rawDisplayName !== "string") {
    return { ok: false, error: "닉네임을 입력해주세요." };
  }
  const displayName = rawDisplayName.trim();
  if (!displayName) {
    return { ok: false, error: "닉네임을 입력해주세요." };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("사용자 정보가 없습니다.");
  }

  if (await isDisplayNameTaken(displayName, userId)) {
    return { ok: false, error: "이미 사용 중인 닉네임입니다." };
  }

  const rawAvatarHash = formData.get("avatarHash");
  if (typeof rawAvatarHash !== "string") {
    return { ok: false, error: "아바타 설정에 실패했습니다." };
  }
  const avatarHash = rawAvatarHash.trim();
  if (!avatarHash) {
    return { ok: false, error: "아바타 설정에 실패했습니다." };
  }

  const [updated] = await db
    .update(users)
    .set({ displayName, avatarHash })
    .where(eq(users.id, userId))
    .returning({
      displayName: users.displayName,
      avatarHash: users.avatarHash,
    });

  if (!updated) {
    return { ok: false, error: "프로필 변경에 실패했습니다." };
  }

  return { ok: true, data: updated };
};
