import { HumanMessage } from "@langchain/core/messages";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import {
  createChatModel,
  resolveAiModel,
} from "@/app/api/chat/_nodes/chat-node/models";
import { findSingleNodeInput } from "@/app/api/chat/_utils/find-single-node-input";
import { spendCreditsByUserId } from "@/features/credits/server/mutations";
import { getCreditBalanceByUserId } from "@/features/credits/server/queries";

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
    throw new Error("nodeId가 문자열이 아닙니다.");
  }

  const modelId = metadata?.data?.content?.value;
  if (typeof modelId !== "string") {
    throw new Error("chat-node 모델이 선택되지 않았습니다.");
  }

  const aiModel = await resolveAiModel(modelId);
  if (!aiModel) {
    throw new Error(`존재하지 않는 모델입니다: ${modelId}`);
  }

  const price = Math.max(0, aiModel.price ?? 0);

  const configurable = config.configurable as
    | Record<string, unknown>
    | undefined;
  const userId =
    typeof configurable?.user_id === "string" ? configurable.user_id : null;

  if (price > 0) {
    if (!userId) {
      throw new Error("사용자 정보가 없습니다.");
    }
    const balance = await getCreditBalanceByUserId(userId);
    if (balance < price) {
      throw new Error("크레딧이 부족합니다.");
    }
  }

  const chatModel = createChatModel(aiModel);
  if (!chatModel) {
    throw new Error(`지원하지 않는 provider입니다: ${aiModel.provider}`);
  }

  const prevNodeId = state.inputTree[nodeId]?.target;
  const isPrevStartNode = prevNodeId === state.startNodeId;
  const messages = [...state.messages];

  if (!isPrevStartNode) {
    const input = findSingleNodeInput({ state, config });
    if (typeof input !== "string") {
      throw new Error("chat-node 입력이 문자열이 아닙니다.");
    }
    const newMessage = new HumanMessage(input);
    messages.push(newMessage);
  }

  const response = await chatModel.invoke(messages);

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
      throw new Error("크레딧이 부족합니다.");
    }
  }

  return { messages: [response], outputMap: { [nodeId]: output } };
};
