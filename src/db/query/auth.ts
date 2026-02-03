"use server";

import { eq } from "drizzle-orm";
import { type User } from "next-auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getUserId(): Promise<string>;
export async function getUserId(opts: { throwOnError?: true }): Promise<string>;
export async function getUserId(opts: {
  throwOnError: false;
}): Promise<string | undefined>;

export async function getUserId(
  { throwOnError }: { throwOnError?: boolean } = { throwOnError: true },
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    if (throwOnError === false) return undefined;
    throw new Error("사용자 정보가 없습니다.");
  }

  return userId;
}

export const getUserProfile = async (): Promise<User> => {
  const userId = await getUserId();
  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarHash: users.avatarHash,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("사용자 정보가 없습니다.");
  }

  return user;
};

export const updateUser = async (
  payload: Partial<Pick<User, "avatarHash" | "displayName">>,
) => {
  const userId = await getUserId();
  const [updated] = await db
    .update(users)
    .set({ ...payload })
    .where(eq(users.id, userId))
    .returning({
      displayName: users.displayName,
      avatarHash: users.avatarHash,
    });

  return updated ?? null;
};

export const updateUserAction = async (formData: FormData) => {
  "use server";

  const rawDisplayName = formData.get("displayName");
  if (typeof rawDisplayName !== "string") {
    return { ok: false, error: "닉네임을 입력해주세요." };
  }
  const displayName = rawDisplayName.trim();
  if (!displayName) {
    return { ok: false, error: "닉네임을 입력해주세요." };
  }

  const rawAvatarHash = formData.get("avatarHash");
  if (typeof rawAvatarHash !== "string") {
    return { ok: false, error: "아바타 설정에 실패했습니다." };
  }
  const avatarHash = rawAvatarHash.trim();
  if (!avatarHash) {
    return { ok: false, error: "아바타 설정에 실패했습니다." };
  }

  const updated = await updateUser({ displayName, avatarHash });

  if (!updated) {
    return { ok: false, error: "프로필 변경에 실패했습니다." };
  }

  return { ok: true, data: updated };
};
