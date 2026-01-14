import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatGoogle } from "@langchain/google-gauth";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { chatNode } from "@/app/api/chat/_nodes/chat-node";
import {
  createChatModel,
  resolveAiModel,
} from "@/app/api/chat/_nodes/chat-node/models";
import { type FlowStateAnnotation } from "@/app/api/chat/flow-state";
import { getActiveAiModels } from "@/db/query/ai-models";
import { type AiModel } from "@/db/schema";

const baseModel: AiModel = {
  id: "model-id",
  modelId: "gemma-3-1b-it",
  name: "Gemma 3 (1B)",
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
}: {
  nodeId: string;
  inputNodeId: string;
  input: string;
}): typeof FlowStateAnnotation.State => {
  const state = {
    inputTree: {},
    outputMap: {},
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
  } as unknown as FlowRunnableConfig;

  return config;
};

vi.mock("@/db/query/ai-models", () => ({
  getActiveAiModels: vi.fn(),
}));

vi.mock("@langchain/google-gauth", () => ({
  ChatGoogle: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
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

    expect(invoke).toHaveBeenCalledWith(input);
    expect(result.outputMap?.[nodeId]).toBe("hello world");
  });
});
