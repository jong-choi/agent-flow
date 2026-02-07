"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotMessageSquare, SquarePen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchChats } from "@/features/chats/api/fetch-chats";
import { chatListQueryKey } from "@/features/chats/components/chat-page/chat-queries";
import { ChatSidebarItem } from "@/features/chats/components/chat-page/chat-sidebar-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatSidebar() {
  return (
    <Suspense fallback={<ChatSidebarFallback />}>
      <ChatSidebarContent />
    </Suspense>
  );
}

function ChatSidebarContent() {
  const pathname = usePathname();
  const { data, isLoading } = useQuery({
    queryKey: chatListQueryKey,
    queryFn: fetchChats,
  });
  const isCreating = pathname.endsWith("/chat");
  const chats = data?.data ?? [];

  return (
    <aside className="flex h-full w-64 max-w-64 shrink-0 flex-col gap-2 border-r border-border bg-background/80 py-6 backdrop-blur">
      <div className="h-7 px-4">
        {isCreating ? (
          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start"
            disabled
          >
            <BotMessageSquare className="size-4" strokeWidth={1.75} />
            채팅
          </Button>
        ) : (
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
        )}
      </div>
      <div className="px-4">
        <Separator />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`chat-skeleton-${index}`}
                className="space-y-2 px-2 py-2"
              >
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
            chats.map((chat) => (
              <ChatSidebarItem
                key={chat.id}
                chat={chat}
                isActive={Boolean(pathname?.startsWith(`/chat/${chat.id}`))}
              />
            ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function ChatSidebarFallback() {
  return (
    <aside className="flex h-full w-64 max-w-64 shrink-0 flex-col gap-2 border-r border-border bg-background/80 py-6 backdrop-blur">
      <div className="h-7 px-4">
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="px-4">
        <Separator />
      </div>
      <ScrollArea className="min-h-0 flex-1 px-4">
        <nav className="flex flex-col gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`chat-sidebar-fallback-${index}`} className="space-y-2 px-2 py-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
