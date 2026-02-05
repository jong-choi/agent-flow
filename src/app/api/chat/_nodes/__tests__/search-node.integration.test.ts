import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { searchNode } from "@/app/api/chat/_nodes/search-node";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";

const originalApiKey = process.env.GOOGLE_SEARCH_API_KEY;
const originalCx = process.env.GOOGLE_SEARCH_CX;

const buildState = ({
  nodeId,
  inputNodeId,
  input,
}: {
  nodeId: string;
  inputNodeId: string;
  input: string | null;
}): typeof FlowStateAnnotation.State => {
  const state = {
    inputTree: {},
    outputMap: {},
  } as typeof FlowStateAnnotation.State;

  state.inputTree[nodeId] = { target: inputNodeId };
  state.outputMap[inputNodeId] = input;

  return state;
};

const buildConfig = (nodeId: string): FlowRunnableConfig =>
  ({
    metadata: { langgraph_node: nodeId },
  }) as unknown as FlowRunnableConfig;

const setEnv = ({ apiKey, cx }: { apiKey?: string; cx?: string }) => {
  if (apiKey === undefined) {
    delete process.env.GOOGLE_SEARCH_API_KEY;
  } else {
    process.env.GOOGLE_SEARCH_API_KEY = apiKey;
  }

  if (cx === undefined) {
    delete process.env.GOOGLE_SEARCH_CX;
  } else {
    process.env.GOOGLE_SEARCH_CX = cx;
  }
};

const buildResponse = ({
  ok = true,
  status = 200,
  statusText = "OK",
  data = null,
}: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  data?: unknown;
}) =>
  ({
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(data),
  }) as unknown as Response;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.GOOGLE_SEARCH_API_KEY;
  } else {
    process.env.GOOGLE_SEARCH_API_KEY = originalApiKey;
  }

  if (originalCx === undefined) {
    delete process.env.GOOGLE_SEARCH_CX;
  } else {
    process.env.GOOGLE_SEARCH_CX = originalCx;
  }

  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe("searchNode (integration)", () => {
  const nodeId = "search-node";
  const inputNodeId = "input-node";

  it("API 키가 없으면 에러가 발생한다", async () => {
    setEnv({});

    const state = buildState({ nodeId, inputNodeId, input: "고양이" });
    const config = buildConfig(nodeId);

    const result = await searchNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe("검색 중 에러가 발생하였습니다.");
  });

  it("nodeId가 문자열이 아니면 에러가 발생한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const state = buildState({ nodeId, inputNodeId, input: "고양이" });
    const config = {
      metadata: { langgraph_node: 123 },
    } as unknown as FlowRunnableConfig;

    await expect(searchNode(state, config)).rejects.toThrow(
      "nodeId가 문자열이 아닙니다.",
    );
  });

  it("입력이 없으면 에러가 발생한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const state = buildState({ nodeId, inputNodeId, input: null });
    const config = buildConfig(nodeId);

    await expect(searchNode(state, config)).rejects.toThrow(
      "검색 노드에 input이 주어지지 않았습니다.",
    );
  });

  it("입력이 2개 이상이면 에러가 발생한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = {
      input1: "input-node-1",
      input2: "input-node-2",
    };
    state.outputMap["input-node-1"] = "입력1";
    state.outputMap["input-node-2"] = "입력2";
    const config = buildConfig(nodeId);

    await expect(searchNode(state, config)).rejects.toThrow(
      "단일 입력 노드에 여러 입력이 있습니다.",
    );
  });

  it("Google Search API 오류를 전파한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const input = "고양이 검색";
    const state = buildState({ nodeId, inputNodeId, input });
    const config = buildConfig(nodeId);
    const fetchMock = vi.fn().mockResolvedValue(
      buildResponse({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe("검색 중 에러가 발생하였습니다.");
  });

  it("검색 결과를 요약해 outputMap에 저장한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const input = "고양이 검색";
    const state = buildState({ nodeId, inputNodeId, input });
    const config = buildConfig(nodeId);
    const items = [
      {
        title: "첫번째 결과",
        link: "https://example.com/1",
        snippet: "스니펫1",
      },
      {
        title: "두번째 결과",
        link: "https://example.com/2",
        snippet: "스니펫2",
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(buildResponse({ data: { items } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchNode(state, config);

    const params = new URLSearchParams({
      key: "test-key",
      cx: "test-cx",
      q: input,
      num: String(10),
      fields: "items(title,link,snippet),searchInformation(totalResults)",
    });
    const expectedUrl = `https://www.googleapis.com/customsearch/v1?${params}`;
    const expectedMessage =
      "검색 결과 (2개):\n\n" +
      "1. 첫번째 결과\n스니펫1\nhttps://example.com/1\n\n" +
      "2. 두번째 결과\n스니펫2\nhttps://example.com/2\n";

    expect(fetchMock).toHaveBeenCalledWith(expectedUrl);
    expect(result.outputMap?.[nodeId]).toBe(expectedMessage);
  });

  it("items가 없으면 에러 메시지를 반환한다", async () => {
    setEnv({ apiKey: "test-key", cx: "test-cx" });

    const input = "고양이 검색";
    const state = buildState({ nodeId, inputNodeId, input });
    const config = buildConfig(nodeId);
    const fetchMock = vi.fn().mockResolvedValue(buildResponse({ data: {} }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchNode(state, config);

    expect(result.outputMap?.[nodeId]).toBe("검색 중 에러가 발생하였습니다.");
  });
});
