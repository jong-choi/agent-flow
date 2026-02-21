import { getEncoding } from "js-tiktoken";
import { HumanMessage } from "@langchain/core/messages";
import {
  createApiError,
  mapUnknownToApiTypedError,
} from "@/app/api/_errors/api-error";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import {
  createChatModel,
  resolveAiModel,
} from "@/app/api/chat/_nodes/chat-node/models";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";
import { spendCreditsByUserId } from "@/features/credits/server/mutations";
import { getCreditBalanceByUserId } from "@/features/credits/server/queries";

const o200kBaseEncoding = getEncoding("o200k_base");
const CHAT_NODE_MAX_O200K_TOKENS = 8000;

/**
 * 채팅 모델 실행 노드
 * outputMap에 있는 값을 HumanMessage 타입으로 넣어 실행하고,
 * 실행된 결과값을 Memory 히스토리에 넣는다.
 */
export const chatNode = async (
  state: typeof FlowStateAnnotation.State,
  config: FlowRunnableConfig,
): Promise<Partial<typeof state>> => {
  const metadata = config.metadata;
  const nodeId = metadata?.langgraph_node;
  if (typeof nodeId !== "string") {
    throw createApiError("invalidRequest", {
      message: "Invalid chat node id.",
    });
  }

  const modelId = metadata?.data?.content?.value;
  if (typeof modelId !== "string") {
    throw createApiError("invalidModel", {
      message: "No model selected for chat node.",
    });
  }

  const aiModel = await resolveAiModel(modelId);
  if (!aiModel) {
    throw createApiError("invalidModel", {
      message: `Unknown model: ${modelId}`,
    });
  }

  const price = Math.max(0, aiModel.price ?? 0);

  const configurable = config.configurable as
    | Record<string, unknown>
    | undefined;
  const userId =
    typeof configurable?.user_id === "string" ? configurable.user_id : null;

  if (price > 0) {
    if (!userId) {
      throw createApiError("authRequired");
    }
    const balance = await getCreditBalanceByUserId(userId);
    if (balance < price) {
      throw createApiError("insufficientCredit");
    }
  }

  const chatModel = createChatModel(aiModel);
  if (!chatModel) {
    throw createApiError("invalidModel", {
      message: `Unsupported provider: ${aiModel.provider}`,
    });
  }

  const prevNodeId = state.inputTree[nodeId]?.target;
  const isPrevStartNode = prevNodeId === state.startNodeId;
  const messages = [...state.messages];

  if (!isPrevStartNode) {
    const input = findSingleNodeInput({ state, config });
    if (typeof input !== "string") {
      throw createApiError("invalidRequest", {
        message: "Invalid chat node input.",
      });
    }
    const newMessage = new HumanMessage(input);
    messages.push(newMessage);
  }

  const o200kBaseTokens = o200kBaseEncoding.encode(
    messages
      .map((message) => {
        const content = message.content;
        if (typeof content === "string") {
          return content;
        }
        return JSON.stringify(content);
      })
      .join("\n\n"),
  ).length;

  if (o200kBaseTokens > CHAT_NODE_MAX_O200K_TOKENS) {
    throw createApiError("rateLimitExceeded", {
      message: `Request too large for model limit (o200k_base). Limit ${CHAT_NODE_MAX_O200K_TOKENS}, requested ${o200kBaseTokens}.`,
    });
  }

  let response;
  try {
    response = await chatModel.invoke(messages);
  } catch (error) {
    throw mapUnknownToApiTypedError(error);
  }

  const content = response.content;

  let output: string;

  if (typeof content === "string") {
    output = content;
  } else {
    output = content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? (b.text as string) : ""))
      .join("");
  }

  if (price > 0 && userId) {
    const description = `모델 사용 : ${modelId}`;

    const spendResult = await spendCreditsByUserId({
      userId,
      amount: price,
      category: "workflow",
      title: "워크플로우 실행",
      description,
    });

    if (!spendResult.ok && spendResult.reason === "insufficient_credit") {
      throw createApiError("insufficientCredit");
    }
  }

  return { messages: [response], outputMap: { [nodeId]: output } };
};
