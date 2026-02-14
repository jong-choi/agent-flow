"use client";

import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { chatQueryKeys } from "@/features/chats/lib/query/queries";
import {
  createChatFromWorkflow,
  softDeleteChat,
  updateChatTitle,
} from "@/features/chats/server/actions";
import { type UserChatPage } from "@/features/chats/server/queries";

const applySidebarTitleUpdate = ({
  oldData,
  chatId,
  title,
}: {
  oldData: InfiniteData<UserChatPage, string> | undefined;
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
      let snapshot: InfiniteData<UserChatPage, string> | undefined;

      queryClient.setQueryData<InfiniteData<UserChatPage, string>>(
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

export const useCreateChatFromWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatFromWorkflow,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: chatQueryKeys.sidebarList,
      });
    },
  });
};

const applySidebarDelete = ({
  oldData,
  chatId,
}: {
  oldData: InfiniteData<UserChatPage, string> | undefined;
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
      let snapshot: InfiniteData<UserChatPage, string> | undefined;

      queryClient.setQueryData<InfiniteData<UserChatPage, string>>(
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
