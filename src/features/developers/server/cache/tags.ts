export const developerTags = {
  secretsByUser: (userId: string) => `developers:user:${userId}:secrets`,
  workflowCanvasByWorkflow: (workflowId: string) =>
    `developers:workflow:${workflowId}:canvas-id`,
  workflowCanvasLookupAll: () => "developers:workflow:canvas-id:lookup",
  workflowCanvasLookupByCanvas: (canvasId: string) =>
    `developers:workflow:canvas-id:lookup:${canvasId}`,
} as const;
