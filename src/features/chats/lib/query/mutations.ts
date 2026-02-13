"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type ChatSidebarPage,
  chatQueryKeys,
} from "@/features/chats/lib/query/queries";
import {
  softDeleteChat,
  updateChatTitle,
} from "@/features/chats/server/actions";

type ChatSidebarInfiniteData = InfiniteData<ChatSidebarPage, string>;

const applySidebarTitleUpdate = ({
  oldData,
  chatId,
  title,
}: {
  oldData: ChatSidebarInfiniteData | undefined;
  chatId: string;
  title: string | null;
}) => {
  if (!oldData) {
    return oldData;
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      items: page.items.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat,
      ),
    })),
  };
};

export const useUpdateChatTitleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatTitle,
    onMutate: ({ chatId, title }) => {
      let snapshot: ChatSidebarInfiniteData | undefined;

      queryClient.setQueryData<ChatSidebarInfiniteData>(
        chatQueryKeys.sidebarList,
        (oldData) => {
          snapshot = oldData;

          return applySidebarTitleUpdate({
            oldData,
            chatId,
            title,
          });
        },
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(chatQueryKeys.sidebarList, context?.snapshot);
    },
  });
};

const applySidebarDelete = ({
  oldData,
  chatId,
}: {
  oldData: ChatSidebarInfiniteData | undefined;
  chatId: string;
}) => {
  if (!oldData) {
    return oldData;
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page) => ({
      ...page,
      items: page.items.filter((chat) => chat.id !== chatId),
    })),
  };
};

export const useDeleteChatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeleteChat,
    onMutate: ({ chatId }) => {
      let snapshot: ChatSidebarInfiniteData | undefined;

      queryClient.setQueryData<ChatSidebarInfiniteData>(
        chatQueryKeys.sidebarList,
        (oldData) => {
          snapshot = oldData;

          return applySidebarDelete({
            oldData,
            chatId,
          });
        },
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(chatQueryKeys.sidebarList, context?.snapshot);
    },
  });
};
