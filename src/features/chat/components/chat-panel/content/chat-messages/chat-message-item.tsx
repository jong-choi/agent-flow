import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownWrapper } from "@/features/chat/components/markdown/markdown-wrapper";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";
import { cn, formatHHMM } from "@/lib/utils";

export function ChatMessageItem({ message }: { message: ClientChatMessage }) {
  return (
    <div
      className={cn(
        "flex w-full",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn("flex flex-col", message.role === "user" ? "" : "w-full")}
      >
        <div
          className={cn(
            "flex flex-col",
            message.role === "user"
              ? "rounded-2xl bg-primary px-4 text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
              : "w-full",
          )}
        >
          <MarkdownWrapper className="-mt-2 text-sm leading-relaxed">
            {message.content}
          </MarkdownWrapper>
        </div>
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            message.role === "user" ? "justify-end" : "justify-start pl-2",
            !message.createdAt && "hidden",
          )}
        >
          <span className="text-xs text-muted-foreground">
            {!!message.createdAt && formatHHMM(message.createdAt)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-muted-foreground"
            aria-label="copy message"
            onClick={() => {
              navigator.clipboard.writeText(message.content);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
