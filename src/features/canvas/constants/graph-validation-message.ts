export const graphValidationMessageCodes = [
  "startNodeCountInvalid",
  "endNodeCountInvalid",
  "disconnectedNodeExists",
  "nodeTypeMissing",
  "chatNodeValueMissing",
  "documentNodeReferenceMissing",
] as const;

export type GraphValidationMessageCode =
  (typeof graphValidationMessageCodes)[number];
