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
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const action = metadata?.data?.content?.value;
  if (!isDocumentAction(action)) {
    throw new Error("documentNode action이 올바르지 않습니다.");
  }

  const referenceId = metadata?.data?.content?.referenceId;
  if (typeof referenceId !== "string" || referenceId.trim().length === 0) {
    throw new Error("documentNode referenceId가 없습니다.");
  }

  if (action === "읽기") {
    const doc = await getDocumentById({ docId: referenceId });
    if (!doc) {
      throw new Error("문서를 찾을 수 없습니다.");
    }

    return { outputMap: { [nodeId]: doc.content } };
  }

  const input = findSingleNodeInput({ state, config });
  if (typeof input !== "string") {
    throw new Error("문서 노드에 input이 주어지지 않았습니다.");
  }

  if (action === "대치") {
    const content = await replaceDocumentContentById({
      docId: referenceId,
      content: input,
    });
    if (content == null) {
      throw new Error("문서를 대치하지 못했습니다.");
    }

    return { outputMap: { [nodeId]: content } };
  }

  if (action === "병합") {
    const content = await mergeDocumentContentById({
      docId: referenceId,
      content: input,
    });
    if (content == null) {
      throw new Error("문서를 병합하지 못했습니다.");
    }

    return { outputMap: { [nodeId]: content } };
  }

  return { outputMap: { [nodeId]: null } };
};
