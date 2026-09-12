import { describe, expect, it } from "vitest";
import { normalizeProviderError } from "../error";
import { getAnswerText, getModelResponse } from "../message";

describe("AI response contract", () => {
  it("extracts only final text without changing signed message parts", () => {
    const content = [
      {
        type: "text",
        thought: true,
        text: "thinking",
        thoughtSignature: "opaque",
      },
      { type: "reasoning", reasoning: "other" },
      { type: "text", text: "안녕 " },
      { type: "text", text: "세상" },
      { type: "tool_use", text: "not an answer" },
    ];
    const before = JSON.stringify(content);
    expect(getAnswerText(content)).toBe("안녕 세상");
    expect(JSON.stringify(content)).toBe(before);
    expect(getAnswerText(null)).toBe("");
    expect(getAnswerText("plain")).toBe("plain");
  });
  it("does not invent usage counts or expose reasoning as answer", () => {
    const usage = { input_tokens: 55, output_tokens: 24, total_tokens: 469 };
    const result = getModelResponse({
      content: "answer",
      additional_kwargs: { reasoning_content: "thinking" },
      usage_metadata: usage,
      response_metadata: { done_reason: "length" },
    });
    expect(result).toEqual({
      answer: "answer",
      reasoning: "thinking",
      usage,
      finishReason: "length",
    });
    expect(getModelResponse({ content: "answer" }).usage).toBeNull();
  });
  it.each([
    { status: 404 },
    { statusCode: 404 },
    { status_code: 404 },
    { response: { status: 404 } },
  ])("recognizes provider status %j", (error) => {
    expect(normalizeProviderError(error)).toMatchObject({
      status: 404,
      category: "not_found",
    });
  });
  it("retains retry metadata but not credentials or request data", () => {
    const result = normalizeProviderError({
      statusCode: 429,
      headers: new Headers({
        "Retry-After": "30",
        authorization: "secret",
        "x-ratelimit-reset-tokens": "1m",
      }),
      data: {
        error: {
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.RetryInfo",
              retryDelay: "30s",
            },
          ],
        },
      },
      request: { body: "private" },
    });
    expect(result).toMatchObject({
      status: 429,
      category: "quota",
      retryAfter: "30",
      retryDelay: "30s",
      resetTokens: "1m",
      code: "RESOURCE_EXHAUSTED",
    });
    expect(JSON.stringify(result)).not.toMatch(/secret|private|authorization/);
  });
  it.each([
    [{ name: "AbortError" }, "cancelled"],
    [{ name: "TimeoutError" }, "timeout"],
    [{ status: 401 }, "authentication"],
    [{ status: 400 }, "invalid_request"],
    [{ status: 503 }, "upstream"],
  ])("classifies %j", (error, category) => {
    expect(normalizeProviderError(error).category).toBe(category);
  });
});
