import { MarkdownWrapper } from "@/features/chat/components/markdown/markdown-wrapper";
import { type ClientChatMessage } from "@/features/chat/utils/chat-message";
import { cn } from "@/lib/utils";

export function PresetChatExamplePreview({
  messages,
}: {
  messages: ClientChatMessage[];
}) {
  return (
    <div className="h-[320px] overflow-auto rounded-lg border bg-muted/20 p-4">
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "space-y-1 rounded-xl border px-3 py-2 text-sm shadow-sm",
                message.role === "assistant" ? "w-full" : "max-w-[75%]",
                message.role === "user" && "bg-primary/10",
                message.role === "assistant" && "bg-background",
              )}
            >
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                {message.role}
              </p>
              <MarkdownWrapper className="px-0 py-0 text-sm leading-relaxed">
                {message.content}
              </MarkdownWrapper>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
