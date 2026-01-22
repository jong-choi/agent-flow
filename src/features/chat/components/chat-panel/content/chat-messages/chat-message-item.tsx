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
            "mt-1 flex",
            message.role === "user" ? "justify-end" : "justify-start pl-2",
          )}
        >
          <span className="text-xs text-muted-foreground">
            {message.createdAt ? formatHHMM(message.createdAt) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
