import { useMemo } from "react";
import { type Edge, type Node, useReactFlow } from "@xyflow/react";

export function useIsValidFlow() {
  const { getEdges, getNodes } = useReactFlow();

  const isValidFlow = useMemo(
    () => checkValidFlow(getNodes(), getEdges()),
    [getEdges, getNodes],
  );

  return isValidFlow;
}

export const checkValidFlow = (nodes: Node[], edges: Edge[]): boolean => {
  return true;
};
