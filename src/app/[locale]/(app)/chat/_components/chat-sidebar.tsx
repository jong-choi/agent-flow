"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, SquarePen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { chatListQueryKey } from "@/app/[locale]/(app)/chat/_components/chat-queries";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatKoreanDate } from "@/lib/utils";

type ChatListItem = {
  id: string;
  workflowId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatListResponse = {
  data: ChatListItem[];
};

const fetchChats = async (): Promise<ChatListResponse> => {
  const response = await fetch("/api/chat/persistent");

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "채팅 목록을 불러오지 못했습니다.";
    throw new Error(message);
  }

  return response.json();
};

export function ChatSidebar() {
  const pathname = usePathname();
  const { data, isLoading } = useQuery({
    queryKey: chatListQueryKey,
    queryFn: fetchChats,
  });

  const chats = data?.data ?? [];

  return (
    <aside className="flex h-full w-52 flex-col gap-2 border-r border-border bg-background/80 px-4 py-6 backdrop-blur">
      {/* <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
        <BotMessageSquare className="size-4" strokeWidth={1.75} />
        채팅
      </div> */}
      {/* <div className="mt-4"> */}
      <Button
        asChild
        size="sm"
        variant="ghost"
        className="w-full justify-start"
      >
        <Link href="/chat">
          <SquarePen className="size-4" strokeWidth={1.75} />새 채팅
        </Link>
      </Button>
      {/* </div> */}
      <Separator />
      <nav className="flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`chat-skeleton-${index}`} className="space-y-2 px-2 py-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}

        {!isLoading && chats.length === 0 && (
          <div className="rounded-md px-3 py-2 text-sm text-muted-foreground">
            아직 시작한 채팅이 없습니다.
          </div>
        )}

        {!isLoading &&
          chats.map((chat) => {
            const isActive = pathname?.startsWith(`/chat/${chat.id}`);
            const title = chat.title ?? formatKoreanDate(chat.createdAt);

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                  isActive && "bg-muted text-foreground",
                )}
              >
                <div className="truncate">{title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  업데이트 {formatKoreanDate(chat.updatedAt)}
                </div>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
