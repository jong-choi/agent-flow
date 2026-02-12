"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { profileTags } from "@/features/profile/server/cache/tags";
import { isDisplayNameTaken } from "@/features/profile/server/queries";

export type UpdateUserErrorCode =
  | "display_name_required"
  | "display_name_taken"
  | "avatar_invalid"
  | "update_failed";

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
    return { ok: false as const, code: "display_name_required" as const };
  }
  const displayName = rawDisplayName.trim();
  if (!displayName) {
    return { ok: false as const, code: "display_name_required" as const };
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("사용자 정보가 없습니다.");
  }

  if (await isDisplayNameTaken(displayName, userId)) {
    return { ok: false as const, code: "display_name_taken" as const };
  }

  const rawAvatarHash = formData.get("avatarHash");
  if (typeof rawAvatarHash !== "string") {
    return { ok: false as const, code: "avatar_invalid" as const };
  }
  const avatarHash = rawAvatarHash.trim();
  if (!avatarHash) {
    return { ok: false as const, code: "avatar_invalid" as const };
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
    return { ok: false as const, code: "update_failed" as const };
  }

  updateTag(profileTags.byUser(userId));

  return { ok: true as const, data: updated };
};
