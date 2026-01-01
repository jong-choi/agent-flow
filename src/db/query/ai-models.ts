"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { aiModels } from "@/db/schema/ai-models";

export const getActiveAiModels = async () => {
  return db
    .select()
    .from(aiModels)
    .where(eq(aiModels.isActive, true))
    .orderBy(desc(aiModels.createdAt));
};
