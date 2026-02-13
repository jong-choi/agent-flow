import { Suspense } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatSidebarClient } from "@/features/chats/components/chat-page/chat-sidebar-client";
import { getChatsByUserPage } from "@/features/chats/server/queries";

export function ChatSidebar({
  params,
  isCreating = false,
}: {
  params: PageProps<"/[locale]/chat">["params"] & Promise<{ chatId?: string }>;
  isCreating?: boolean;
}) {
  return (
    <Suspense fallback={<ChatSidebarFallback />}>
      <ChatSidebarContent params={params} isCreating={isCreating} />
    </Suspense>
  );
}

async function ChatSidebarContent({
  params,
  isCreating = false,
}: {
  params: PageProps<"/[locale]/chat">["params"] & Promise<{ chatId?: string }>;

  isCreating?: boolean;
}) {
  const resolevedParams = await params;
  const chatId = resolevedParams.chatId;
  const initialPage = await getChatsByUserPage({ limit: 30 });

  return (
    <ChatSidebarClient
      chatId={chatId}
      isCreating={isCreating}
      initialPage={initialPage}
    />
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
            <div
              key={`chat-sidebar-fallback-${index}`}
              className="space-y-2 px-2 py-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
