export const chatListQueryKey = ["chat", "list"];

export type ChatListItem = {
  id: string;
  workflowId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatListResponse = {
  data: ChatListItem[];
};

export type ChatPageWorkflow = {
  id: string;
  title: string;
  description: string | null;
  updatedAt: Date;
};
