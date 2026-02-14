"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getChatsByUserPageAction } from "@/features/chats/server/actions";
import { type UserChatPage } from "@/features/chats/server/queries";

const CHAT_SIDEBAR_PAGE_SIZE = 30;

export const chatQueryKeys = {
  sidebarList: ["chat", "sidebar", "list"] as const,
};

const getUserChatPage = async (cursor?: string) =>
  getChatsByUserPageAction({
    cursor: typeof cursor === "string" && cursor ? cursor : undefined,
    limit: CHAT_SIDEBAR_PAGE_SIZE,
  });

export const useChatSidebarInfiniteQuery = ({
  initialPage,
}: {
  initialPage: UserChatPage;
}) =>
  useInfiniteQuery({
    queryKey: chatQueryKeys.sidebarList,
    queryFn: ({ pageParam }) =>
      getUserChatPage(
        typeof pageParam === "string" && pageParam ? pageParam : undefined,
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    initialData: {
      pages: [initialPage],
      pageParams: [""],
    },
  });
