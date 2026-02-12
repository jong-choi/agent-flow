import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ChatPageWorkflow } from "@/features/chats/components/chat-page/chat-queries";
import { ChatWorkflowCard } from "@/features/chats/components/chat-page/chat-workflow-card";
import { getOwnedWorkflowsForChat } from "@/features/chats/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function ChatWorkflowListDialog({ locale }: { locale: string }) {
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Chat",
  });
  const workflowList = await getOwnedWorkflowsForChat();

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
          <div className="grid grid-cols-3 gap-4">
            {workflowList.map((workflow: ChatPageWorkflow) => {
              return (
                <ChatWorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  locale={locale}
                />
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
