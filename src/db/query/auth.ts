"use server";

import { and, eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type User } from "next-auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getRandomName } from "@/lib/unique-name";

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

export const isDisplayNameTaken = async (
  displayName: string,
  excludeUserId?: string,
) => {
  const clauses = [eq(users.displayName, displayName)];
  if (excludeUserId) {
    clauses.push(ne(users.id, excludeUserId));
  }

  const whereClause = clauses.length === 1 ? clauses[0] : and(...clauses);
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(whereClause)
    .limit(1);

  return Boolean(user);
};

export const createUniqueDisplayName = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = getRandomName();
    if (!(await isDisplayNameTaken(candidate))) {
      return candidate;
    }
  }

  return `${getRandomName()}${nanoid(2)}`;
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

  const userId = await getUserId();
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

  const updated = await updateUser({ displayName, avatarHash });

  if (!updated) {
    return { ok: false, error: "프로필 변경에 실패했습니다." };
  }

  return { ok: true, data: updated };
};
