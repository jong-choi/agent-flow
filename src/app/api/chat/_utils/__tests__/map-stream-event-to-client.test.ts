import { describe, expect, it } from "vitest";
import { type LanggraphStreamEvent } from "@/app/api/chat/_types/chat-events";
import { mapLanggraphEventToClientEvent } from "@/app/api/chat/_utils/map-stream-event-to-client";

describe("mapLanggraphEventToClientEvent", () => {
  it("chat model stream 이벤트를 client 이벤트로 변환한다", () => {
    const source = {
      event: "on_chat_model_stream",
      metadata: {
        type: "chatNode",
        langgraph_node: "chat-1",
      },
      data: {
        chunk: {
          content: "hello",
        },
      },
    } as LanggraphStreamEvent;

    const mapped = mapLanggraphEventToClientEvent(source);

    expect(mapped).toEqual({
      type: "chatNode",
      event: "on_chat_model_stream",
      langgraph_node: "chat-1",
      chunk: { content: "hello" },
    });
  });

  it("chat model stream의 content가 문자열이 아니면 무시한다", () => {
    const source = {
      event: "on_chat_model_stream",
      metadata: {
        type: "chatNode",
        langgraph_node: "chat-1",
      },
      data: {
        chunk: {
          content: 123,
        },
      },
    } as LanggraphStreamEvent;

    const mapped = mapLanggraphEventToClientEvent(source);

    expect(mapped).toBeNull();
  });

  it("검색 노드 chain start/end 이벤트를 그대로 전달한다", () => {
    const startEvent = {
      event: "on_chain_start",
      metadata: {
        type: "searchNode",
        langgraph_node: "search-1",
      },
    } as LanggraphStreamEvent;
    const endEvent = {
      event: "on_chain_end",
      metadata: {
        type: "searchNode",
        langgraph_node: "search-1",
      },
    } as LanggraphStreamEvent;

    expect(mapLanggraphEventToClientEvent(startEvent)).toEqual({
      type: "searchNode",
      event: "on_chain_start",
      langgraph_node: "search-1",
    });
    expect(mapLanggraphEventToClientEvent(endEvent)).toEqual({
      type: "searchNode",
      event: "on_chain_end",
      langgraph_node: "search-1",
    });
  });

  it("chatNode의 chain 이벤트는 중복 방지를 위해 전달하지 않는다", () => {
    const source = {
      event: "on_chain_start",
      metadata: {
        type: "chatNode",
        langgraph_node: "chat-1",
      },
    } as LanggraphStreamEvent;

    const mapped = mapLanggraphEventToClientEvent(source);

    expect(mapped).toBeNull();
  });
});
