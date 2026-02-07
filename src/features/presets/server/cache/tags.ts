export const presetTags = {
  market: () => "presets:market",
  detailByPreset: (presetId: string) => `presets:detail:${presetId}`,
  ownedByUser: (userId: string) => `presets:user:${userId}:owned`,
  purchasedByUser: (userId: string) => `presets:user:${userId}:purchased`,
  canvasLibraryByUser: (userId: string) =>
    `presets:user:${userId}:canvas-library`,
  pricingByWorkflow: (workflowId: string) =>
    `presets:workflow:${workflowId}:pricing`,
} as const;
