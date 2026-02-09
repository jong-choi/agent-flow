import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import "server-only";
import { cache } from "react";
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
  { throwOnError = true }: { throwOnError?: boolean } = { throwOnError: true },
) {
  return getUserIdCached(throwOnError);
}

const getUserIdCached = cache(async (throwOnError: boolean) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    if (throwOnError === false) {
      return undefined;
    }

    throw new Error("사용자 정보가 없습니다.");
  }

  return userId;
});

const isDisplayNameTakenForCreateUnique = cache(async (displayName: string) => {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.displayName, displayName))
    .limit(1);

  return Boolean(user);
});

export const createUniqueDisplayName = async () => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = getRandomName();
    if (!(await isDisplayNameTakenForCreateUnique(candidate))) {
      return candidate;
    }
  }

  return `${getRandomName()}${nanoid(2)}`;
};
