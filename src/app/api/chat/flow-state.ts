import { Annotation } from "@langchain/langgraph";

export type OutputMap = Record<string, string | null>;
export type InputTree = Record<string, Record<string, string>>;

export const FlowStateAnnotation = Annotation.Root({
  outputMap: Annotation<OutputMap>({
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  }),
  inputTree: Annotation<InputTree>({
    reducer: (left, right) => ({ ...left, ...right }),
    default: () => ({}),
  }),
});
