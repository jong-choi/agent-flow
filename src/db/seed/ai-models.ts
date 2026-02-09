import { db } from "@/db/client";
import { type AiModelInsert, aiModels } from "@/db/schema/ai-models";

const aiModelsData: AiModelInsert[] = [
  {
    modelId: "gemma-3-1b-it",
    name: "Gemma 3 (1B, IT)",
    order: 50001,
    provider: "google",
    contextWindow: 32768,
    price: 1,
    isActive: true,
    metadata: {
      maxOutputTokens: 32768,
    },
  },

  {
    modelId: "gemma-3n-e4b-it",
    name: "Gemma 3n (E4B, IT)",
    order: 50003,
    provider: "google",
    contextWindow: 8192,
    price: 2,
    isActive: true,
    metadata: {
      maxOutputTokens: 2048,
    },
  },
  {
    modelId: "gemma-3-4b-it",
    name: "Gemma 3 (4B, IT)",
    order: 50004,
    provider: "google",
    contextWindow: 128000,
    price: 4,
    isActive: true,
    metadata: {
      maxOutputTokens: 128000,
    },
  },

  {
    modelId: "gemma-3-27b-it",
    name: "Gemma 3 (27B, IT)",
    order: 50005,
    provider: "google",
    contextWindow: 128000,
    price: 8,
    isActive: true,
    metadata: {
      maxOutputTokens: 128000,
    },
  },

  {
    modelId: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    order: 70001,
    provider: "groq",
    contextWindow: 131072,
    price: 15, // 8 * 2
    isActive: true,
    metadata: {
      maxOutputTokens: 65536,
    },
  },
  {
    modelId: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    order: 70002,
    provider: "groq",
    contextWindow: 131072,
    price: 10 * 2,
    isActive: true,
    metadata: {
      maxOutputTokens: 65536,
    },
  },
  {
    modelId: "llama-3.1-8b-instant",
    name: "Llama3.1 8B",
    order: 80001,
    provider: "groq",
    contextWindow: 131072,
    price: 5, // 3 * 2
    isActive: true,
    metadata: {
      maxOutputTokens: 131072,
    },
  },
  {
    modelId: "meta-llama/llama-4-scout-17b-16e-instruct",
    name: "Llama 4 Scout",
    provider: "groq",
    order: 80002,
    contextWindow: 131072,
    price: 15 * 2,
    isActive: true,
    metadata: { maxOutputTokens: 8192 },
  },
  {
    modelId: "meta-llama/llama-4-maverick-17b-128e-instruct",
    name: "Llama 4 Maverick",
    order: 80003,
    provider: "groq",
    contextWindow: 131072,
    price: 60 * 2,
    isActive: true,
    metadata: { maxOutputTokens: 8192 },
  },
  //   {
  //   modelId: "qwen/qwen3-32b",
  //   name: "Qwen3 32B",
  //   provider: "groq",
  //   contextWindow: 131072,
  //   price: 13 * 2,
  //   isActive: true,
  //   metadata: {
  //     maxOutputTokens: 40960,
  //   },
  // },
  // {
  //   modelId: "gemma-3n-e2b-it",
  //   name: "Gemma 3n (E2B, IT)",
  //   provider: "google",
  //   contextWindow: 8192,
  //   price: 1,
  //   isActive: true,
  //   metadata: {
  //     maxOutputTokens: 2048,
  //   },
  // },
  // {
  //   modelId: "gemma-3-12b-it",
  //   name: "Gemma 3 (12B, IT)",
  //   provider: "google",
  //   contextWindow: 128000,
  //   price: 6,
  //   isActive: true,
  //   metadata: {
  //     maxOutputTokens: 128000,
  //   },
  // },
] as const;

export const seedAiModels = async () => {
  await db.transaction(async (tx) => {
    for (const model of aiModelsData) {
      await tx
        .insert(aiModels)
        .values(model)
        .onConflictDoUpdate({
          target: aiModels.modelId,
          set: {
            name: model.name,
            order: model.order,
            provider: model.provider,
            contextWindow: model.contextWindow,
            price: model.price,
            isActive: model.isActive,
            metadata: model.metadata,
          },
        });
    }
  });
};
