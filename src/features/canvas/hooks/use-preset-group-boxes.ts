import { useMemo } from "react";
import { type FlowCanvasNode } from "@/db/types/sidebar-nodes";
import {
  type PresetGroupBox,
  buildPresetGroupBoxes,
} from "@/features/canvas/utils/preset-groups";

export const usePresetGroupBoxes = (
  nodes: FlowCanvasNode[],
): PresetGroupBox[] => useMemo(() => buildPresetGroupBoxes(nodes), [nodes]);
