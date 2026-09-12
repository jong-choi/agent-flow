import { getEncoding } from "js-tiktoken";
import { HumanMessage } from "@langchain/core/messages";
import {
  createApiError,
  mapProviderErrorToApi,
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
import { runAiCall } from "@/lib/ai/execution";
import { prepareModelMessages, tagModelMessage } from "@/lib/ai/history";
import { assertCompleteAnswer, getAnswerText } from "@/lib/ai/message";
import { getModelLimits } from "@/lib/ai/registry";
import {
  finishModelExecution,
  startModelExecution,
} from "@/lib/ai/registry-store";

const o200kBaseEncoding = getEncoding("o200k_base");

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

  const price = aiModel.price!;
  const limits = getModelLimits(aiModel);

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

  const preparedMessages = prepareModelMessages(messages, aiModel);
  const o200kBaseTokens = o200kBaseEncoding.encode(
    preparedMessages
      .map((message) => {
        const content = message.content;
        if (typeof content === "string") {
          return content;
        }
        return JSON.stringify(content);
      })
      .join("\n\n"),
  ).length;

  if (o200kBaseTokens > limits.input) {
    throw createApiError("rateLimitExceeded", {
      message: `Request too large for model limit (o200k_base). Limit ${limits.input}, requested ${o200kBaseTokens}.`,
    });
  }

  const execution = await startModelExecution(aiModel, {
    userId: userId ?? undefined,
    threadId:
      typeof configurable?.thread_id === "string"
        ? configurable.thread_id
        : undefined,
    nodeId,
  });
  let completed = false;
  try {
    let response;
    try {
      response = await runAiCall(
        (signal) => chatModel.invoke(preparedMessages, { signal }),
        { signal: config.signal },
      );
      assertCompleteAnswer(response);
    } catch (error) {
      throw mapProviderErrorToApi(error);
    }

    const output = getAnswerText(response.content);

    if (price > 0 && userId) {
      const description = `모델 사용 : ${aiModel.name} (${aiModel.provider})`;

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

    completed = true;
    return {
      messages: [tagModelMessage(response, aiModel)],
      outputMap: { [nodeId]: output },
    };
  } finally {
    try {
      await finishModelExecution(
        execution.id,
        completed ? "succeeded" : "failed",
      );
    } catch (error) {
      if (completed) throw error;
      console.error("Could not finalize failed model execution", execution.id);
    }
  }
};
