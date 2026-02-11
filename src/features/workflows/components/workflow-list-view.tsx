import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOwnedWorkflows } from "@/features/workflows/server/queries";
import { WorkflowListCard } from "@/features/workflows/components/workflow-list-card";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export async function WorkflowListView() {
  const t = await getTranslations<AppMessageKeys>("Workflows");
  const workflowList = await getOwnedWorkflows();

  return (
    <>
      {workflowList.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>{t("listView.emptyTitle")}</CardTitle>
            <CardDescription>
              {t("listView.emptyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" asChild>
              <Link href="/workflows/canvas">{t("listView.createWorkflow")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowList.map((workflow) => (
            <WorkflowListCard
              key={workflow.id}
              href={`/workflows/canvas/${workflow.id}`}
              workflowId={workflow.id}
              title={workflow.title}
              description={workflow.description}
              updatedAt={workflow.updatedAt}
              actionLabel={t("listView.detail")}
            />
          ))}
        </div>
      )}
    </>
  );
}
