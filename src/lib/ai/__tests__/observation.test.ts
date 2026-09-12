// @vitest-environment node
import { expect, it, vi } from "vitest";
import { AIMessage } from "@langchain/core/messages";
import { testModel } from "@/testing/fixtures/ai-model";
import { observeModelCall } from "../execution";

const { record } = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("../maintenance/state-store", () => ({
  assertModelAdmission: vi.fn(),
  recordObservation: record,
}));
it("does not record provider success when cancellation wins before completion", async () => {
  const controller = new AbortController();
  const reason = new DOMException("fixture cancellation", "AbortError");
  await expect(
    observeModelCall(
      async () => {
        controller.abort(reason);
        return new AIMessage("partial");
      },
      { model: testModel(), signal: controller.signal },
    ),
  ).rejects.toBe(reason);
  expect(record).toHaveBeenCalledTimes(1);
  expect(record).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ category: "cancelled" }),
    }),
  );
});
