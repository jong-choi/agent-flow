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
  await expect(
    observeModelCall(
      async () => {
        controller.abort();
        return new AIMessage("partial");
      },
      { model: testModel(), signal: controller.signal },
    ),
  ).rejects.toBe(controller.signal.reason);
  expect(record).toHaveBeenCalledTimes(1);
  expect(record).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ category: "cancelled" }),
    }),
  );
});
