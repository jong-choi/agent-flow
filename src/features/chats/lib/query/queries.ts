"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getChatsByUserPageAction } from "@/features/chats/server/actions";

const CHAT_SIDEBAR_PAGE_SIZE = 30;

export type ChatSidebarPage = Awaited<
  ReturnType<typeof getChatsByUserPageAction>
>;

type UseChatSidebarInfiniteQueryParams = {
  initialPage: ChatSidebarPage;
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
