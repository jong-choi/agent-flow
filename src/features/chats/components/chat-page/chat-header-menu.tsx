import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { ChatStartMenuItem } from "@/features/chats/components/chat-page/chat-start-menu-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatHeaderMenuProps = {
  workflowId?: string | null;
  workflowTitle: string;
};

export function ChatHeaderMenu({
  workflowId,
  workflowTitle,
}: ChatHeaderMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="truncate text-sm text-muted-foreground"
        >
          {workflowTitle}
          <Ellipsis className="-ml-1 size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            워크플로우
          </div>
          <div className="truncate text-sm font-semibold text-foreground">
            {workflowTitle}
          </div>
        </div>
        <DropdownMenuSeparator />
        <ChatStartMenuItem workflowId={workflowId} />
        {workflowId ? (
          <DropdownMenuItem asChild>
            <Link href={`/workflows/${workflowId}`}>상세 보기</Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>상세 보기</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
