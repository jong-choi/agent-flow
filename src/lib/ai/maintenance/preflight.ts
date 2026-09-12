import { createApiError } from "@/app/api/_errors/api-error";
import type { FlowNode } from "@/app/api/chat/_types/nodes";
import type { AiModel } from "@/db/schema/ai-models";
import { findModelByReference } from "../registry";
import { listModelRegistry } from "../registry-store";
import { availabilityMap } from "./state-store";

export async function preflightModels(
  nodes: Pick<FlowNode, "id" | "type" | "data">[],
): Promise<Record<string, AiModel>> {
  const chatNodes = nodes.filter((n) => n.type === "chatNode");
  if (!chatNodes.length) return {};
  const models = await listModelRegistry();
  const availability = await availabilityMap(models);
  const result: Record<string, AiModel> = {};
  const invalid: string[] = [];
  for (const node of chatNodes) {
    const ref = node.data.content?.value;
    const model = ref ? findModelByReference(models, ref) : null;
    if (
      !model ||
      !availability.get(model.id)?.available ||
      !["google", "groq", "ollama"].includes(model.provider)
    )
      invalid.push(node.id);
    else result[node.id] = model;
  }
  if (invalid.length)
    throw createApiError("invalidModel", {
      message: `Unavailable models in nodes: ${invalid.join(", ")}. Choose replacement models before running.`,
    });
  return result;
}
