"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BotMessageSquare, SquarePen } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { ChatSidebarItem } from "@/features/chats/components/chat-page/chat-sidebar-item";
import { getChatsByUserPageAction } from "@/features/chats/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const CHAT_SIDEBAR_PAGE_SIZE = 30;
const chatSidebarQueryKey = ["chat", "sidebar", "list"] as const;

type ChatSidebarClientProps = {
  chatId?: string;
  isCreating?: boolean;
  initialPage: Awaited<ReturnType<typeof getChatsByUserPageAction>>;
};

export function ChatSidebarClient({
  chatId,
  isCreating = false,
  initialPage,
}: ChatSidebarClientProps) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: chatSidebarQueryKey,
      queryFn: ({ pageParam }) =>
        getChatsByUserPageAction({
          cursor:
            typeof pageParam === "string" && pageParam
              ? pageParam
              : undefined,
          limit: CHAT_SIDEBAR_PAGE_SIZE,
        }),
      initialPageParam: "",
      getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
      initialData: {
        pages: [initialPage],
        pageParams: [""],
      },
    });

  const chats = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <div className="h-7 px-4">
        {isCreating ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            disabled
          >
            <BotMessageSquare className="size-4" strokeWidth={1.75} />
            {t("sidebar.currentChat")}
          </Button>
        ) : (
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="w-full justify-start"
          >
            <Link href="/chat">
              <SquarePen className="size-4" strokeWidth={1.75} />
              {t("sidebar.newChat")}
            </Link>
          </Button>
        )}
      </div>
      <div className="px-4">
        <Separator />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="flex min-h-full flex-col py-1">
          <nav className="flex flex-col gap-1">
            {chats.length === 0 ? (
              <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
                {t("sidebar.empty")}
              </div>
            ) : (
              chats.map((chat) => (
                <ChatSidebarItem
                  key={chat.id}
                  chat={chat}
                  isActive={Boolean(chatId && chatId === chat.id)}
                />
              ))
            )}
          </nav>
          {hasNextPage ? (
            <div className="mt-auto pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Spinner className="size-4" /> : null}
                {t("action.more")}
              </Button>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </>
  );
}
