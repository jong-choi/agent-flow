import type { AiModel } from "@/db/schema/ai-models";
import { initialProviderModels } from "../onboarding";
import { initialFreeCandidates } from "./initial-candidates";
import { DAY } from "./policy";

// These provider/model profiles have reviewed free-tier eligibility. Discovery
// still requires an official catalog entry and invoke + stream verification.
// Unknown catalog entries remain candidates; catalog presence alone is not free access.
export const automaticModelProfiles = [
  ...initialProviderModels,
  ...initialFreeCandidates,
];

export function automaticModelProfile(provider: string, model: string) {
  return automaticModelProfiles.find(
    (profile) =>
      profile.provider === provider && profile.upstreamModelId === model,
  );
}

export function hasAutomaticFreeAccess(
  model: Pick<
    AiModel,
    "provider" | "upstreamModelId" | "catalogCheckedAt" | "catalogMetadata"
  >,
  now = Date.now(),
) {
  if (!automaticModelProfile(model.provider, model.upstreamModelId))
    return false;
  const source = {
    google: "https://generativelanguage.googleapis.com/v1beta/models",
    groq: "https://api.groq.com/openai/v1/models",
    ollama: "https://ollama.com/api/tags",
  }[model.provider];
  const checked = model.catalogCheckedAt?.getTime();
  return Boolean(
    source &&
      model.catalogMetadata.sourceUrl === source &&
      checked !== undefined &&
      checked <= now &&
      now - checked <= 8 * DAY,
  );
}
