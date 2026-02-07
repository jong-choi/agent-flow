import "server-only";

import { cacheTag } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { aiModels } from "@/db/schema/ai-models";

const ACTIVE_AI_MODELS_TAG = "ai-models:active";

export const getActiveAiModelsBase = async () => {
  return db
    .select()
    .from(aiModels)
    .where(eq(aiModels.isActive, true))
    .orderBy(desc(aiModels.createdAt));
};

const getActiveAiModelsCached = async () => {
  "use cache";
  cacheTag(ACTIVE_AI_MODELS_TAG);

  return getActiveAiModelsBase();
};

export const getActiveAiModels = async () => getActiveAiModelsCached();
