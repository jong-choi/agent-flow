import { describe, expect, it } from "vitest";
import { buildPresetGroupBoxes } from "@/features/canvas/utils/preset-groups";

describe("preset-groups", () => {
  it("presetId/instanceId 기준으로 노드를 그룹핑하고 padding을 포함한 박스를 계산한다", () => {
    const nodes = [
      {
        id: "preset:p1:i1:a",
        position: { x: 100, y: 100 },
        measured: { width: 50, height: 40 },
      },
      {
        id: "preset:p1:i1:b",
        position: { x: 200, y: 150 },
        width: 60,
        height: 50,
      },
      {
        id: "not-a-preset",
        position: { x: 0, y: 0 },
      },
      {
        id: "preset:p2:i2:c",
        position: { x: 10, y: 20 },
        measured: { width: 30, height: 30 },
      },
    ];

    const groups = buildPresetGroupBoxes(nodes);

    expect(groups).toHaveLength(2);

    const group1 = groups.find((group) => group.key === "p1:i1");
    expect(group1).toMatchObject({
      presetId: "p1",
      instanceId: "i1",
      x: 76,
      y: 76,
      width: 208,
      height: 148,
    });
    expect(group1?.nodeIds.sort()).toEqual(
      ["preset:p1:i1:a", "preset:p1:i1:b"].sort(),
    );

    const group2 = groups.find((group) => group.key === "p2:i2");
    expect(group2).toMatchObject({
      presetId: "p2",
      instanceId: "i2",
      x: -14,
      y: -4,
      width: 78,
      height: 78,
    });
  });
});
