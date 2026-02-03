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
