import type { AiModel } from "@/db/schema";
import {
  createProviderModel,
  supportedThinkingLevels,
} from "@/lib/ai/adapters";
import { isSelectableModel } from "@/lib/ai/registry";
import {
  getModelByReference,
  listModelRegistry,
} from "@/lib/ai/registry-store";
import { selectTitleModel } from "@/lib/ai/title-policy";

export async function resolveAiModel(
  reference: string,
): Promise<AiModel | null> {
  const model = await getModelByReference(reference);
  return model && isSelectableModel(model) ? model : null;
}
export const createChatModel = createProviderModel;
export async function getTitleModel() {
  const model = selectTitleModel(await listModelRegistry());
  if (!model) throw new Error("No available title model configured");
  const levels = supportedThinkingLevels(model.provider, model.upstreamModelId);
  const result = createProviderModel({
    ...model,
    appMaxOutputTokens: 512,
    metadata: {
      ...model.metadata,
      thinkingLevel: levels.includes("minimal")
        ? "minimal"
        : levels.includes("low")
          ? "low"
          : "default",
    },
  });
  if (!result) throw new Error("Title model provider is unsupported");
  return result;
}
