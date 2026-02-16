import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { ChatGoogle } from "@langchain/google-gauth";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { chatNode } from "@/app/api/chat/_nodes/chat-node";
import {
  createChatModel,
  resolveAiModel,
} from "@/app/api/chat/_nodes/chat-node/models";
import { type AiModel } from "@/db/schema";
import { getActiveAiModels } from "@/features/chats/server/queries";
import { spendCreditsByUserId } from "@/features/credits/server/mutations";
import { getCreditBalanceByUserId } from "@/features/credits/server/queries";

const baseModel: AiModel = {
  id: "model-id",
  modelId: "gemma-3-1b-it",
  name: "Gemma 3 (1B)",
  order: 1,
  provider: "google",
  contextWindow: 8192,
  price: 1,
  isActive: true,
  metadata: { maxOutputTokens: 2048 },
  createdAt: new Date(),
};

const buildState = ({
  nodeId,
  inputNodeId,
  input,
  messages = [],
  startNodeId = "",
}: {
  nodeId: string;
  inputNodeId: string;
  input: string;
  messages?: BaseMessage[];
  startNodeId?: string;
}): typeof FlowStateAnnotation.State => {
  const state = {
    inputTree: {},
    outputMap: {},
    messages,
    startNodeId,
  } as typeof FlowStateAnnotation.State;

  state.inputTree[nodeId] = { target: inputNodeId };
  state.outputMap[inputNodeId] = input;

  return state;
};

const buildConfig = ({
  nodeId,
  modelId,
}: {
  nodeId: string;
  modelId: string;
}): FlowRunnableConfig => {
  const config = {
    metadata: {
      langgraph_node: nodeId,
      data: { content: { value: modelId } },
    },
    configurable: { thread_id: "thread-id", user_id: "user-id" },
  } as unknown as FlowRunnableConfig;

  return config;
};

vi.mock("@/features/chats/server/queries", () => ({
  getActiveAiModels: vi.fn(),
}));

vi.mock("@/features/credits/server/queries", () => ({
  getCreditBalanceByUserId: vi.fn(),
}));

vi.mock("@/features/credits/server/mutations", () => ({
  spendCreditsByUserId: vi.fn(),
}));

vi.mock("@langchain/google-gauth", () => ({
  ChatGoogle: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCreditBalanceByUserId).mockResolvedValue(9999);
  vi.mocked(spendCreditsByUserId).mockResolvedValue({
    ok: true,
    balance: 9999,
  });
});

describe("chat-node models (unit)", () => {
  it("resolveAiModel은 modelId에 맞는 모델을 반환한다", async () => {
    vi.mocked(getActiveAiModels).mockResolvedValue([baseModel]);

    const result = await resolveAiModel("gemma-3-1b-it");

    expect(result).toBe(baseModel);
  });

  it("createChatModel은 지원 provider면 ChatGoogle을 생성하고 아니면 null을 반환한다", () => {
    const invoke = vi.fn();

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    const created = createChatModel(baseModel);
    const unsupported = createChatModel({
      ...baseModel,
      provider: "anthropic",
    });

    expect(created).toBeDefined();
    expect(vi.mocked(ChatGoogle)).toHaveBeenCalledWith(
      expect.objectContaining({
        model: baseModel.modelId,
        maxOutputTokens: 2048,
      }),
    );
    expect(unsupported).toBeNull();
  });
});

describe("chatNode (integration)", () => {
  const nodeId = "chat-node";
  const inputNodeId = "input-node";

  it("모델 조회 실패 시 에러를 던진다", async () => {
    const modelId = "missing-model";
    const state = buildState({ nodeId, inputNodeId, input: "안녕" });
    const config = buildConfig({ nodeId, modelId });
    vi.mocked(getActiveAiModels).mockResolvedValue([]);

    await expect(() => chatNode(state, config)).rejects.toThrow(
      `존재하지 않는 모델입니다: ${modelId}`,
    );
  });

  it("지원하지 않는 provider면 에러를 던진다", async () => {
    const modelId = "gemma-3-1b-it";
    const state = buildState({ nodeId, inputNodeId, input: "안녕" });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([
      {
        ...baseModel,
        modelId,
        provider: "anthropic",
      },
    ]);

    await expect(() => chatNode(state, config)).rejects.toThrow(
      "지원하지 않는 provider입니다: anthropic",
    );
  });

  it("invoke 실패 시 에러를 전파한다", async () => {
    const modelId = "gemma-3-1b-it";
    const state = buildState({ nodeId, inputNodeId, input: "안녕" });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockRejectedValue(new Error("invoke failed"));

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    await expect(() => chatNode(state, config)).rejects.toThrow(
      "invoke failed",
    );
  });

  it("입력 -> 모델 조회 -> invoke 결과를 outputMap에 저장한다", async () => {
    const modelId = "gemma-3-1b-it";
    const input = "안녕";
    const state = buildState({ nodeId, inputNodeId, input });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockResolvedValue({
      content: [
        { type: "text", text: "hello " },
        { type: "text", text: "world" },
        { type: "image", text: "ignored" },
      ],
    });

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    const result = await chatNode(state, config);

    const [messagesArg] = invoke.mock.calls[0];
    expect(messagesArg).toHaveLength(1);
    expect(messagesArg[0]).toMatchObject({ content: input });
    expect(result.outputMap?.[nodeId]).toBe("hello world");
    expect(vi.mocked(spendCreditsByUserId)).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-id",
        amount: baseModel.price,
        category: "workflow",
        title: "워크플로우 실행",
        description: `모델 사용 : ${modelId}`,
      }),
    );
  });

  it("멀티턴: 이전 메시지를 포함해 invoke를 호출한다", async () => {
    const modelId = "gemma-3-1b-it";
    const input = "새 질문";
    const previousMessages = [
      new HumanMessage("이전 질문"),
      new AIMessage("이전 답변"),
    ];
    const state = buildState({
      nodeId,
      inputNodeId,
      input,
      messages: previousMessages,
    });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockResolvedValue({ content: "ok" });

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    await chatNode(state, config);

    const [messagesArg] = invoke.mock.calls[0];
    expect(messagesArg).toHaveLength(3);
    expect(messagesArg[0]).toBe(previousMessages[0]);
    expect(messagesArg[1]).toBe(previousMessages[1]);
    expect(messagesArg[2]).toMatchObject({ content: input });
  });

  it("직전 노드가 startNode면 input을 HumanMessage로 추가하지 않는다", async () => {
    const modelId = "gemma-3-1b-it";
    const input = "토끼";
    const messages = [
      new HumanMessage("안녕"),
      new AIMessage("안녕하세요"),
      new HumanMessage(input),
    ];
    const state = buildState({
      nodeId,
      inputNodeId,
      input,
      messages,
      startNodeId: inputNodeId,
    });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockResolvedValue({ content: "ok" });

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    await chatNode(state, config);

    const [messagesArg] = invoke.mock.calls[0] as [BaseMessage[]];
    expect(messagesArg).toHaveLength(messages.length);

    const lastMessageArg = messagesArg.at(-1);
    expect(lastMessageArg).toBeInstanceOf(HumanMessage);
    expect(lastMessageArg?.content).toBe(input);
  });

  it("직전 노드가 startNode가 아니면  input을 새 HumanMessage로 추가한다", async () => {
    const modelId = "gemma-3-1b-it";
    const initialInput = "토끼";
    const input = `${initialInput}을 검색해줘`;
    const messages = [
      new HumanMessage("안녕"),
      new AIMessage("안녕하세요"),
      new HumanMessage(initialInput),
    ];
    const state = buildState({
      nodeId,
      inputNodeId,
      input,
      messages,
      startNodeId: "different-start-node",
    });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockResolvedValue({ content: "ok" });

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    await chatNode(state, config);

    const [messagesArg] = invoke.mock.calls[0] as [BaseMessage[]];
    expect(messagesArg).toHaveLength(messages.length + 1);

    const lastMessageArg = messagesArg.at(-1);
    expect(lastMessageArg).toBeInstanceOf(HumanMessage);
    expect(lastMessageArg?.content).toBe(input);
  });

  it("멀티턴: 응답 문자열을 outputMap에 저장한다", async () => {
    const modelId = "gemma-3-1b-it";
    const input = "후속 질문";
    const state = buildState({
      nodeId,
      inputNodeId,
      input,
      messages: [new HumanMessage("이전 질문")],
    });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const invoke = vi.fn().mockResolvedValue({ content: "최종 응답" });

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    const result = await chatNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe("최종 응답");
  });

  it("응답 메시지를 messages에 저장한다", async () => {
    const modelId = "gemma-3-1b-it";
    const input = "안녕";
    const state = buildState({ nodeId, inputNodeId, input });
    const config = buildConfig({ nodeId, modelId });

    vi.mocked(getActiveAiModels).mockResolvedValue([{ ...baseModel, modelId }]);

    const response = new AIMessage("ok");
    const invoke = vi.fn().mockResolvedValue(response);

    function MockChatGoogle() {
      return { invoke };
    }

    vi.mocked(ChatGoogle).mockImplementation(MockChatGoogle);

    const result = await chatNode(state, config);

    expect(result.messages).toEqual([response]);
  });
});
