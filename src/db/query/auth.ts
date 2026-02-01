"use server";

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
