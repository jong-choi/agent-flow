export type ChatListItem = {
  id: string;
  workflowId: string;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type ChatPageWorkflow = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
};
