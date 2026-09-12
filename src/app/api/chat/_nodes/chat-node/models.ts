import { ChatGoogle } from "@langchain/google-gauth";
import { ChatGroq } from "@langchain/groq";
import { type AiModel } from "@/db/schema";
import { getActiveAiModels } from "@/features/chats/server/queries";
import { aiFetch } from "@/lib/ai/execution";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const resolveAiModel = async (
  modelId: string,
): Promise<AiModel | null> => {
  //서버에 캐싱된 데이터를 활용
  const models = await getActiveAiModels();
  const model = models.find((m) => m.modelId === modelId);
  if (!model) return null;
  return model;
};

class QueuedChatGoogle extends ChatGoogle {
  buildAbstractedClient(): never {
    throw new Error("GOOGLE_AI_API_KEY is required for queued Google calls");
  }
  buildApiKeyClient(apiKey: string) {
    return Object.assign(super.buildApiKeyClient(apiKey), { _fetch: aiFetch });
  }
}

export const getSmallestModel = () => {
  return new QueuedChatGoogle({
    model: "gemma-3n-e2b-it",
    apiKey: GOOGLE_AI_API_KEY,
    maxRetries: 0,
  });
};

const chatModelBuilders = {
  google: (aiModel: AiModel) =>
    new QueuedChatGoogle({
      model: aiModel.modelId,
      maxOutputTokens: aiModel.metadata?.maxOutputTokens || 8192,
      apiKey: GOOGLE_AI_API_KEY,
      maxRetries: 0,
    }),
  groq: (aiModel: AiModel) =>
    new ChatGroq({
      model: aiModel.modelId,
      maxTokens: aiModel.metadata?.maxOutputTokens || 8192,
      apiKey: GROQ_API_KEY,
      maxRetries: 0,
      fetch: aiFetch,
    }),
} as const;

const isSupportedProvider = (
  provider: string,
): provider is keyof typeof chatModelBuilders => {
  return provider in chatModelBuilders;
};

export const createChatModel = (aiModel: AiModel) => {
  if (!isSupportedProvider(aiModel.provider)) return null;

  return chatModelBuilders[aiModel.provider](aiModel);
};
