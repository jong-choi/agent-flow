import { Copy } from "lucide-react";
import { ContentMarkdown } from "@/components/markdown/content-markdown";
import { Button } from "@/components/ui/button";
import { type ClientChatMessage } from "@/features/chats/utils/chat-message";
import { cn, formatKoreanDate } from "@/lib/utils";

export function ChatMessageItem({ message }: { message: ClientChatMessage }) {
  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          message.role === "user" ? "max-w-4/5" : "w-full",
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            message.role === "user"
              ? "items-center rounded-2xl bg-secondary p-4"
              : "w-full",
          )}
        >
          <ContentMarkdown>{message.content}</ContentMarkdown>
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            message.role === "user" ? "justify-end" : "justify-start",
            !message.createdAt && "hidden",
          )}
        >
          <span className="text-xs text-muted-foreground">
            {!!message.createdAt && formatKoreanDate(message.createdAt)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-muted-foreground"
            aria-label="copy message"
            onClick={() => {
              void navigator.clipboard.writeText(message.content);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
