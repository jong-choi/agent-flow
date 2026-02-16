import { type BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export type OutputMap = Record<string, string | null>;
export type InputTree = Record<string, Record<string, string>>;
export type InitialInput = string | null;
type StartNodeId = string | null;

export const FlowStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: messagesStateReducer,
  }),
  initialInput: Annotation<InitialInput>({
    reducer: (prev, next) => (next === undefined ? prev : next),
    default: () => null,
  }),
  startNodeId: Annotation<StartNodeId>({
    reducer: (prev, next) => (next === undefined ? prev : next),
    default: () => null,
  }),
  outputMap: Annotation<OutputMap>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  inputTree: Annotation<InputTree>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});
