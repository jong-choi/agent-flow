export const workflowTags = {
  allByUser: (ownerId: string) => `workflows:user:${ownerId}:all`,
  listByUser: (ownerId: string) => `workflows:user:${ownerId}:list`,
  recentByUser: (ownerId: string) => `workflows:user:${ownerId}:recent`,
  graphByWorkflow: (workflowId: string) => `workflows:${workflowId}:graph`,
  metaByWorkflow: (workflowId: string) => `workflows:${workflowId}:meta`,
} as const;
