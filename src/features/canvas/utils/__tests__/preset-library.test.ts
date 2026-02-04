import { describe, expect, it } from "vitest";
import { filterPresetLibrary } from "@/features/canvas/utils/preset-library";

describe("preset-library", () => {
  it("query/title 기반으로 필터한다", () => {
    const presets = [
      { id: "1", title: "고양이", workflowId: "w1" },
      { id: "2", title: "강아지", workflowId: "w2" },
    ];

    expect(
      filterPresetLibrary(presets, { query: "고", excludeWorkflowId: "" }).map(
        (p) => p.id,
      ),
    ).toEqual(["1"]);
  });

  it("excludeWorkflowId가 있으면 해당 workflowId 프리셋을 제외한다", () => {
    const presets = [
      { id: "1", title: "A", workflowId: "w1" },
      { id: "2", title: "B", workflowId: "w2" },
    ];

    expect(
      filterPresetLibrary(presets, { query: "", excludeWorkflowId: "w1" }).map(
        (p) => p.id,
      ),
    ).toEqual(["2"]);
  });
});
