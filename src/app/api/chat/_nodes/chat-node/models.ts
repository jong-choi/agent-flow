import { ChatGoogle } from "@langchain/google-gauth";
import { getActiveAiModels } from "@/db/query/ai-models";
import { type AiModel } from "@/db/schema";

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

export const resolveAiModel = async (
  modelId: string,
): Promise<AiModel | null> => {
  //서버에 캐싱된 데이터를 활용
  const models = await getActiveAiModels();
  const model = models.find((m) => m.modelId === modelId);
  if (!model) return null;
  return model;
};

const chatModelBuilders = {
  google: (aiModel: AiModel) =>
    new ChatGoogle({
      model: aiModel.modelId,
      maxOutputTokens: aiModel.metadata?.maxOutputTokens || 8192,
      apiKey: GOOGLE_AI_API_KEY,
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
