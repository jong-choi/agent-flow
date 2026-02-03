"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { type ChatListItem } from "@/app/[locale]/(app)/chat/_components/chat-queries";
import { ChatSidebarDeleteDialog } from "@/app/[locale]/(app)/chat/_components/chat-sidebar-delete-dialog";
import { ChatSidebarInput } from "@/app/[locale]/(app)/chat/_components/chat-sidebar-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatKoreanDate } from "@/lib/utils";

type ChatSidebarItemProps = {
  chat: ChatListItem;
  isActive: boolean;
};

export function ChatSidebarItem({ chat, isActive }: ChatSidebarItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const displayTitle = chat.title?.trim() || formatKoreanDate(chat.createdAt);

  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
        isActive && "bg-muted text-foreground",
      )}
    >
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <ChatSidebarInput chat={chat} onClose={() => setIsEditing(false)} />
        ) : (
          <Link
            href={`/chat/${chat.id}`}
            aria-current={isActive ? "page" : undefined}
            className="block"
          >
            <div className="truncate">{displayTitle}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatKoreanDate(chat.updatedAt)}
            </div>
          </Link>
        )}
      </div>
      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="채팅 메뉴"
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setIsEditing(true);
              }}
            >
              이름 바꾸기
            </DropdownMenuItem>
            <ChatSidebarDeleteDialog chatId={chat.id} isActive={isActive} />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
