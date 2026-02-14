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
  updateChatTitleIfMissing,
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

export const useUpdateChatTitleIfMissingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateChatTitleIfMissing,
    onSuccess: (updated) => {
      if (!updated) {
        return;
      }

      queryClient.setQueryData<InfiniteData<UserChatPage, string>>(
        chatQueryKeys.sidebarList,
        (oldData) =>
          applySidebarTitleUpdate({
            oldData,
            chatId: updated.id,
            title: updated.title,
          }),
      );
    },
  });
};

const applySidebarChatInsert = ({
  oldData,
  chat,
}: {
  oldData: InfiniteData<UserChatPage, string> | undefined;
  chat: UserChatPage["items"][number];
}) => {
  if (!oldData) {
    return oldData;
  }

  const exists = oldData.pages.some((page) =>
    page.items.some((item) => item.id === chat.id),
  );
  if (exists) {
    return oldData;
  }

  return {
    ...oldData,
    pages: oldData.pages.map((page, index) =>
      index === 0 ? { ...page, items: [chat, ...page.items] } : page,
    ),
  };
};

export const useCreateChatFromWorkflowMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatFromWorkflow,
    onSuccess: (createdChat) => {
      queryClient.setQueryData<InfiniteData<UserChatPage, string>>(
        chatQueryKeys.sidebarList,
        (oldData) =>
          applySidebarChatInsert({
            oldData,
            chat: createdChat,
          }),
      );
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
