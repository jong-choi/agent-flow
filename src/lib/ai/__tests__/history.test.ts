import { expect, it } from "vitest";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { testModel } from "@/testing/fixtures/ai-model";
import {
  prepareModelMessages,
  restoreChatMessage,
  storeModelMessages,
  tagModelMessage,
} from "../history";
import { getAnswerText } from "../message";

it("keeps signed provider messages after JSON persistence and reloading", () => {
  const model = testModel();
  const source = new AIMessage({
    id: "response-id",
    content: [
      {
        type: "text",
        thought: true,
        text: "reasoning",
        thoughtSignature: "signature",
      },
      { type: "text", text: "answer" },
    ],
    additional_kwargs: { signature: "opaque" },
    tool_calls: [
      { id: "call-id", name: "lookup", args: { key: "x" }, type: "tool_call" },
    ],
  });
  const tagged = tagModelMessage(source, model);
  const stored = JSON.parse(JSON.stringify(storeModelMessages([tagged])));
  const restored = restoreChatMessage({
    id: "db-row",
    role: "assistant",
    content: "answer",
    modelMessages: stored,
  });
  expect(restored[0].content).toEqual(source.content);
  expect((restored[0] as AIMessage).tool_calls).toEqual(source.tool_calls);
  expect(prepareModelMessages(restored, model)[0]).toBe(restored[0]);
  expect(getAnswerText(restored[0].content)).toBe("answer");
  expect(source.additional_kwargs.agentflowModel).toBeUndefined();
  const foreign = prepareModelMessages(
    [...restored, new ToolMessage({ tool_call_id: "call-id", content: "12" })],
    testModel({ provider: "groq", upstreamModelId: "openai/gpt-oss-20b" }),
  );
  expect(foreign[0].content).toBe("answer");
  expect((foreign[0] as AIMessage).tool_calls).toEqual([]);
  expect(foreign[1]).toBeInstanceOf(HumanMessage);
});
it("reads legacy text history with stable message IDs", () => {
  expect(
    restoreChatMessage({
      id: "old-row",
      role: "assistant",
      content: "old answer",
    })[0],
  ).toMatchObject({ id: "old-row", content: "old answer" });
});
