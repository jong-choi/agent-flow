"use client";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { replaceModelReferences } from "./replace-models";

export function useReplaceModels() {
  const { setNodes } = useCanvasReactFlow();
  const setUpdatedAt = useCanvasStore((s) => s.setUpdatedAt);
  return (
    source: string,
    target: string,
    options: { id: string; value: string; legacyValue?: string }[],
  ) => {
    setNodes((nodes) => replaceModelReferences(nodes, source, target, options));
    requestAnimationFrame(() => setUpdatedAt(Date.now().toString()));
  };
}
