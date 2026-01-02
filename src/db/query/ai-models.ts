"use server";

import { unstable_cache } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { aiModels } from "@/db/schema/ai-models";

export const getActiveAiModelsBase = async () => {
  return db
    .select()
    .from(aiModels)
    .where(eq(aiModels.isActive, true))
    .orderBy(desc(aiModels.createdAt));
};

export const getActiveAiModels = unstable_cache(
  getActiveAiModelsBase,
  ["ai_models"],
  { tags: ["ai_models"], revalidate: 60 * 60 * 24 * 30 },
);
