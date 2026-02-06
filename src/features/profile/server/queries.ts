import "server-only";

import { and, eq, ne } from "drizzle-orm";
import { type User } from "next-auth";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";

const getRequiredUserId = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("사용자 정보가 없습니다.");
  }

  return userId;
};

export const getUserProfile = async (): Promise<User> => {
  const userId = await getRequiredUserId();
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
