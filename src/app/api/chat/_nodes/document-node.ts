import { createApiError } from "@/app/api/_errors/api-error";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";
import {
  mergeDocumentContentById,
  replaceDocumentContentById,
} from "@/features/documents/server/mutations";
import { getDocumentById } from "@/features/documents/server/queries";

const DOCUMENT_ACTIONS = ["읽기", "대치", "병합"] as const;
type DocumentAction = (typeof DOCUMENT_ACTIONS)[number];

const isDocumentAction = (value: unknown): value is DocumentAction =>
  typeof value === "string" &&
  (DOCUMENT_ACTIONS as readonly string[]).includes(value);

export const documentNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw createApiError("invalidRequest", {
      message: "Invalid document node id.",
    });
  }

  const action = metadata?.data?.content?.value;
  if (!isDocumentAction(action)) {
    throw createApiError("invalidRequest", {
      message: "Invalid document node action.",
    });
  }

  const referenceId = metadata?.data?.content?.referenceId;
  if (typeof referenceId !== "string" || referenceId.trim().length === 0) {
    throw createApiError("invalidRequest", {
      message: "Missing document reference id.",
    });
  }

  if (action === "읽기") {
    const doc = await getDocumentById({ docId: referenceId });
    if (!doc) {
      throw createApiError("invalidRequest", {
        status: 404,
        type: "not_found_error",
        message: "Document not found.",
      });
    }

    return { outputMap: { [nodeId]: doc.content } };
  }

  const input = findSingleNodeInput({ state, config });
  if (typeof input !== "string") {
    throw createApiError("invalidRequest", {
      message: "Missing document node input.",
    });
  }

  if (action === "대치") {
    const content = await replaceDocumentContentById({
      docId: referenceId,
      content: input,
    });
    if (content == null) {
      throw createApiError("internalError", {
        message: "Failed to replace document content.",
      });
    }

    return { outputMap: { [nodeId]: content } };
  }

  if (action === "병합") {
    const content = await mergeDocumentContentById({
      docId: referenceId,
      content: input,
    });
    if (content == null) {
      throw createApiError("internalError", {
        message: "Failed to merge document content.",
      });
    }

    return { outputMap: { [nodeId]: content } };
  }

  return { outputMap: { [nodeId]: null } };
};
