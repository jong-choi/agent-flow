import { ChatGoogle } from "@langchain/google-gauth";
import { ChatGroq } from "@langchain/groq";
import { type AiModel } from "@/db/schema";
import { aiFetch } from "@/lib/ai/execution";
import { getModelLimits, isSelectableModel } from "@/lib/ai/registry";
import { getModelByReference } from "@/lib/ai/registry-store";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const resolveAiModel = async (
  modelId: string,
): Promise<AiModel | null> => {
  const model = await getModelByReference(modelId);
  return model && isSelectableModel(model) ? model : null;
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
      model: aiModel.upstreamModelId,
      maxOutputTokens: getModelLimits(aiModel).output,
      apiKey: GOOGLE_AI_API_KEY,
      maxRetries: 0,
    }),
  groq: (aiModel: AiModel) =>
    new ChatGroq({
      model: aiModel.upstreamModelId,
      maxTokens: getModelLimits(aiModel).output,
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
