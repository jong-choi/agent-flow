import { getEncoding } from "js-tiktoken";
import { randomUUID } from "node:crypto";
import { mapStoredMessagesToChatMessages } from "@langchain/core/messages";
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
import { revalidateCreditTags } from "@/features/credits/server/mutations";
import {
  releaseExpiredModelCredits,
  releaseModelCredits,
  reserveModelCredits,
  settleModelCredits,
} from "@/lib/ai/billing";
import { observeModelCall, runAiCall } from "@/lib/ai/execution";
import {
  prepareModelMessages,
  storeModelMessages,
  tagModelMessage,
} from "@/lib/ai/history";
import { getAnswerText } from "@/lib/ai/message";
import { getModelLimits } from "@/lib/ai/registry";

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

  const aiModel =
    state.modelsByNode?.[nodeId] ?? (await resolveAiModel(modelId));
  if (!aiModel) {
    throw createApiError("invalidModel", {
      message: `Unknown model: ${modelId}`,
    });
  }

  const limits = getModelLimits(aiModel);

  const configurable = config.configurable as
    | Record<string, unknown>
    | undefined;
  const userId =
    typeof configurable?.user_id === "string" ? configurable.user_id : null;

  if (!userId) throw createApiError("authRequired");

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

  let reservation: Awaited<ReturnType<typeof reserveModelCredits>> | undefined;
  const threadId =
    typeof configurable?.thread_id === "string"
      ? configurable.thread_id
      : undefined;
  const turnId =
    typeof configurable?.model_execution_turn === "string"
      ? configurable.model_execution_turn
      : randomUUID();
  try {
    const response = await runAiCall(
      async (signal) => {
        await releaseExpiredModelCredits();
        reservation = await reserveModelCredits(aiModel, {
          userId,
          threadId,
          nodeId,
          executionKey: JSON.stringify([
            userId,
            threadId,
            turnId,
            nodeId,
            aiModel.id,
          ]),
        });
        if (reservation.cached)
          return mapStoredMessagesToChatMessages(reservation.cached)[0];
        let answer;
        try {
          answer = await observeModelCall(
            (current) =>
              chatModel.invoke(preparedMessages, { signal: current }),
            { model: aiModel, signal },
          );
        } catch (error) {
          throw mapProviderErrorToApi(error);
        }
        signal.throwIfAborted();
        const tagged = tagModelMessage(answer, aiModel);
        await settleModelCredits(
          reservation.id,
          storeModelMessages([tagged]),
          `모델 사용 : ${aiModel.name} (${aiModel.provider})`,
        );
        return tagged;
      },
      { signal: config.signal },
    );
    return {
      messages: [response],
      outputMap: { [nodeId]: getAnswerText(response.content) },
    };
  } finally {
    if (reservation) {
      try {
        await releaseModelCredits(reservation.id);
      } finally {
        revalidateCreditTags(userId);
      }
    }
  }
};
