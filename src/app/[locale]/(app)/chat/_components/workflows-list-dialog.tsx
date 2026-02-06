import { ChevronRight } from "lucide-react";
import { WorkflowCard } from "@/app/[locale]/(app)/chat/_components/workflow-card";
import { type ChatPageWorkflow } from "@/app/[locale]/(app)/chat/page";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOwnedWorkflows } from "@/features/workflows/server/queries";

export async function WorkflowsListDialog() {
  const workflowList = await getOwnedWorkflows();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          더 보기 <ChevronRight />
        </Button>
      </DialogTrigger>
      <DialogContent
        ariaDescribedby="workflows list dialog"
        className="sm:max-w-5xl"
      >
        <DialogTitle>워크플로우 목록</DialogTitle>
        <ScrollArea className="overflow-auto md:h-[50vh]">
          <div className="grid grid-cols-3 gap-4">
            {workflowList.map((workflow: ChatPageWorkflow) => {
              return <WorkflowCard key={workflow.id} workflow={workflow} />;
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
