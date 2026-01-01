import { db } from "@/db/client";
import { type AiModelInsert, aiModels } from "@/db/schema/ai-models";

const aiModelsData: AiModelInsert[] = [
  {
    modelId: "gemma-3-1b-it",
    name: "Gemma 3 (1B, IT)",
    provider: "google",
    contextWindow: 32768,
    price: 1,
    isActive: true,
    metadata: {
      maxOutputTokens: 8192,
    },
  },
  {
    modelId: "gemma-3-4b-it",
    name: "Gemma 3 (4B, IT)",
    provider: "google",
    contextWindow: 131072,
    price: 4,
    isActive: true,
    metadata: {
      maxOutputTokens: 8192,
    },
  },
  {
    modelId: "gemma-3-12b-it",
    name: "Gemma 3 (12B, IT)",
    provider: "google",
    contextWindow: 131072,
    price: 6,
    isActive: true,
    metadata: {
      maxOutputTokens: 8192,
    },
  },
  {
    modelId: "gemma-3-27b-it",
    name: "Gemma 3 (27B, IT)",
    provider: "google",
    contextWindow: 131072,
    price: 8,
    isActive: true,
    metadata: {
      maxOutputTokens: 8192,
    },
  },
] as const;

export const seedAiModels = async () => {
  await db.insert(aiModels).values(aiModelsData).onConflictDoNothing();
};
