// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/persistent/[chatId]/title/route";

const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/features/chats/server/queries", () => ({
  getChatById: vi.fn().mockResolvedValue({ id: "test" }),
}));
vi.mock("@/app/api/chat/_nodes/chat-node/models", () => ({
  getTitleModel: () => ({ model: {}, llm: { invoke } }),
}));
vi.mock("@/lib/ai/execution", () => ({
  runAiCall: (fn: (signal: AbortSignal) => Promise<unknown>) =>
    fn(new AbortController().signal),
}));
beforeEach(() => {
  invoke.mockReset();
});
it("uses only final text for a block-based generated title", async () => {
  invoke.mockResolvedValue({
    content: [
      { type: "text", thought: true, text: "not the title" },
      { type: "text", text: "작업 시간" },
    ],
  });
  const response = await POST(
    new Request("http://localhost/api/chat/persistent/test/title", {
      method: "POST",
      body: JSON.stringify({ message: "작업 A와 B" }),
    }),
    { params: Promise.resolve({ chatId: "test" }) },
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ title: "작업 시간" });
});
it("keeps upstream failures out of the client payload", async () => {
  invoke.mockRejectedValue({
    status: 404,
    message: "private upstream request",
  });
  const response = await POST(
    new Request("http://localhost/api/chat/persistent/test/title", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    }),
    { params: Promise.resolve({ chatId: "test" }) },
  );
  expect(response.status).toBe(502);
  expect(JSON.stringify(await response.json())).not.toContain("private");
});
