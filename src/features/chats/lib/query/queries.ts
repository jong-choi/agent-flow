"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getChatsByUserPageAction } from "@/features/chats/server/actions";
import { type UserChatPage } from "@/features/chats/server/queries";

const CHAT_SIDEBAR_PAGE_SIZE = 30;

type UseChatSidebarInfiniteQueryParams = {
  initialPage: UserChatPage;
};

export const chatQueryKeys = {
  sidebarList: ["chat", "sidebar", "list"] as const,
};

const getChatSidebarPage = async (cursor?: string) =>
  getChatsByUserPageAction({
    cursor: typeof cursor === "string" && cursor ? cursor : undefined,
    limit: CHAT_SIDEBAR_PAGE_SIZE,
  });

export const useChatSidebarInfiniteQuery = ({
  initialPage,
}: UseChatSidebarInfiniteQueryParams) =>
  useInfiniteQuery({
    queryKey: chatQueryKeys.sidebarList,
    queryFn: ({ pageParam }) =>
      getChatSidebarPage(
        typeof pageParam === "string" && pageParam ? pageParam : undefined,
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    initialData: {
      pages: [initialPage],
      pageParams: [""],
    },
  });

const selectChatTitleByChatId = ({
  data,
  chatId,
}: {
  data: InfiniteData<UserChatPage, string>;
  chatId: string;
}) => {
  if (!chatId || !data) return null;

  for (const page of data.pages) {
    const found = page.items.find((item) => item.id === chatId);
    if (found) return found.title ?? null;
  }
  return null;
};

export const useChatTitleByChatId = (chatId: string): string | null => {
  const queryClient = useQueryClient();

  const data = queryClient.getQueryData<InfiniteData<UserChatPage, string>>(
    chatQueryKeys.sidebarList,
  );

  if (!data || !chatId) {
    return null;
  }

  return selectChatTitleByChatId({ data, chatId });
};
