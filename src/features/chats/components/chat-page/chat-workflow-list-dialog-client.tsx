"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { ChatWorkflowCard } from "@/features/chats/components/chat-page/chat-workflow-card";
import { getOwnedWorkflowsForChatPageAction } from "@/features/chats/server/actions";
import { type ChatPageWorkflow } from "@/features/chats/types/chat-page-list";
import { type AppMessageKeys } from "@/lib/i18n/messages";

const CHAT_WORKFLOW_DIALOG_PAGE_SIZE = 20;
const chatWorkflowDialogQueryKey = ["chat", "workflow-dialog", "list"] as const;

export function ChatWorkflowListDialogClient({
  initialPage,
}: {
  initialPage: Awaited<ReturnType<typeof getOwnedWorkflowsForChatPageAction>>;
}) {
  const t = useTranslations<AppMessageKeys>("Chat");
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: chatWorkflowDialogQueryKey,
      queryFn: ({ pageParam }) =>
        getOwnedWorkflowsForChatPageAction({
          cursor:
            typeof pageParam === "string" && pageParam ? pageParam : undefined,
          limit: CHAT_WORKFLOW_DIALOG_PAGE_SIZE,
        }),
      initialPageParam: "",
      getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
      initialData: {
        pages: [initialPage],
        pageParams: [""],
      },
    });

  const workflowList = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {t("action.more")} <ChevronRight />
        </Button>
      </DialogTrigger>
      <DialogContent
        ariaDescribedby="workflows list dialog"
        className="sm:max-w-5xl"
      >
        <DialogTitle>{t("dialog.workflowListTitle")}</DialogTitle>
        <ScrollArea className="overflow-auto md:h-[50vh]">
          <div className="flex min-h-full flex-col">
            {workflowList.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {t("page.empty.noWorkflows")}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {workflowList.map((workflow: ChatPageWorkflow) => (
                  <ChatWorkflowCard key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
            {hasNextPage ? (
              <div className="mt-auto flex justify-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? <Spinner className="size-4" /> : null}
                  {t("action.more")}
                </Button>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
