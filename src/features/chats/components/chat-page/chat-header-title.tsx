"use client";

import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatSidebarDeleteDialog } from "@/features/chats/components/chat-page/chat-sidebar-delete-dialog";
import { ChatTitleInput } from "@/features/chats/components/chat-page/chat-title-input";
import { cn } from "@/lib/utils";

type ChatHeaderTitleProps = {
  chatId: string;
  chatTitle: string | null;
};

export function ChatHeaderTitle({ chatId, chatTitle }: ChatHeaderTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [optimisticTitle, setOptimisticTitle] = useState<string | null>(null);

  const displayTitle = chatTitle?.trim() || "New chat";

  return (
    <div className="flex items-center gap-2 md:max-w-[50vw]">
      <div className={cn("min-w-0", isEditing && "w-[50vw]")}>
        {isEditing ? (
          <ChatTitleInput
            chatId={chatId}
            currentTitle={chatTitle?.trim() || ""}
            onClose={() => {
              setIsEditing(false);
            }}
            onBlur={(optimisticTitle) => setOptimisticTitle(optimisticTitle)}
            variant="header"
          />
        ) : (
          <div className="cursor-default truncate text-lg font-semibold text-foreground">
            {optimisticTitle || displayTitle}
          </div>
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
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={() => {
                setIsEditing(true);
              }}
            >
              이름 바꾸기
            </DropdownMenuItem>
            <ChatSidebarDeleteDialog chatId={chatId} isActive />
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
