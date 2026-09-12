import type { AiModel } from "@/db/schema/ai-models";
import { isSelectableModel } from "./registry";

export function selectTitleModel(models: AiModel[]) {
  return (
    models
      .filter(
        (model) =>
          isSelectableModel(model) &&
          ["google", "groq", "ollama"].includes(model.provider) &&
          model.metadata?.titlePriority !== undefined,
      )
      .sort(
        (a, b) =>
          a.metadata!.titlePriority! - b.metadata!.titlePriority! ||
          a.id.localeCompare(b.id),
      )[0] ?? null
  );
}
