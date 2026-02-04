import { PageContainer } from "@/components/page-template";
import { Separator } from "@/components/ui/separator";
import { getChatsByWorkflowId } from "@/db/query/chat";

const WORKFLOW_ID = "50ff011e-e8f3-4270-bf1b-88156c34314e";

export default async function TestPage() {
  const chats = await getChatsByWorkflowId({ workflowId: WORKFLOW_ID });

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">getChatsByWorkflowId 테스트</h1>
          <p className="text-sm text-muted-foreground">
            workflowId: {WORKFLOW_ID}
          </p>
        </div>
        <Separator />
        <pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted/40 p-4 text-xs">
          {JSON.stringify(chats, null, 2)}
        </pre>
      </div>
    </PageContainer>
  );
}
