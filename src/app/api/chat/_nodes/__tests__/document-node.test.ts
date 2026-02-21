import { describe, expect, it, vi } from "vitest";
import { type FlowRunnableConfig } from "@/app/api/chat/_constants/runnable-config";
import { type FlowStateAnnotation } from "@/app/api/chat/_engines/flow-state";
import { documentNode } from "@/app/api/chat/_nodes/document-node";
import {
  mergeDocumentContentById,
  replaceDocumentContentById,
} from "@/features/documents/server/mutations";
import { getDocumentById } from "@/features/documents/server/queries";

vi.mock("@/features/documents/server/queries", () => {
  return {
    getDocumentById: vi.fn(),
  };
});

vi.mock("@/features/documents/server/mutations", () => {
  return {
    replaceDocumentContentById: vi.fn(),
    mergeDocumentContentById: vi.fn(),
  };
});

describe("documentNode", () => {
  it("referenceId가 없으면 에러가 발생한다", async () => {
    const nodeId = "document-node";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "읽기" },
        },
      },
    } as unknown as FlowRunnableConfig;

    await expect(documentNode(state, config)).rejects.toMatchObject({
      code: "invalid_request",
      type: "invalid_request_error",
    });
  });

  it("읽기는 문서 내용을 outputMap에 저장한다", async () => {
    const nodeId = "document-node";
    const docId = "doc-1";

    vi.mocked(getDocumentById).mockResolvedValueOnce({
      id: docId,
      title: "제목",
      content: "문서 내용",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "읽기", referenceId: docId },
        },
      },
    } as unknown as FlowRunnableConfig;

    const result = await documentNode(state, config);

    expect(getDocumentById).toHaveBeenCalledWith({ docId });
    expect(result.outputMap?.[nodeId]).toBe("문서 내용");
  });

  it("대치는 input으로 문서를 대치하고 결과를 outputMap에 저장한다", async () => {
    const nodeId = "document-node";
    const docId = "doc-1";
    const inputNodeId = "input-node";
    const input = "새 내용";

    vi.mocked(replaceDocumentContentById).mockResolvedValueOnce(input);

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = { target: inputNodeId };
    state.outputMap[inputNodeId] = input;

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "대치", referenceId: docId },
        },
      },
    } as unknown as FlowRunnableConfig;

    const result = await documentNode(state, config);

    expect(replaceDocumentContentById).toHaveBeenCalledWith({
      docId,
      content: input,
    });
    expect(result.outputMap?.[nodeId]).toBe(input);
  });

  it("병합은 input을 문서에 병합하고 결과를 outputMap에 저장한다", async () => {
    const nodeId = "document-node";
    const docId = "doc-1";
    const inputNodeId = "input-node";
    const input = "추가";
    const merged = "기존추가";

    vi.mocked(mergeDocumentContentById).mockResolvedValueOnce(merged);

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = { target: inputNodeId };
    state.outputMap[inputNodeId] = input;

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "병합", referenceId: docId },
        },
      },
    } as unknown as FlowRunnableConfig;

    const result = await documentNode(state, config);

    expect(mergeDocumentContentById).toHaveBeenCalledWith({
      docId,
      content: input,
    });
    expect(result.outputMap?.[nodeId]).toBe(merged);
  });

  it("대치/병합인데 input이 없으면 에러가 발생한다", async () => {
    const nodeId = "document-node";
    const docId = "doc-1";

    const state = {
      inputTree: {},
      outputMap: {},
    } as typeof FlowStateAnnotation.State;
    state.inputTree[nodeId] = {};

    const config = {
      metadata: {
        langgraph_node: nodeId,
        data: {
          content: { value: "대치", referenceId: docId },
        },
      },
    } as unknown as FlowRunnableConfig;

    await expect(documentNode(state, config)).rejects.toMatchObject({
      code: "invalid_request",
      type: "invalid_request_error",
    });
  });
});
