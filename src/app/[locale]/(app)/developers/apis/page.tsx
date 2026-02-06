import Link from "next/link";
import {
  PageContainer,
  PageDescription,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { getOwnedWorkflows } from "@/db/query/workflows";
import { WorkflowApiList } from "@/features/developers/components/apis/workflow-api-list";

export default async function DevelopersApisPage() {
  const workflows = await getOwnedWorkflows();
  const baseUrl = process.env.BASE_URL || "";

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <PageHeading>워크플로우 API</PageHeading>
            <PageDescription>
              워크플로우별 <code>X-CANVAS-ID</code>를 발급하고 호출 코드를
              복사합니다.
            </PageDescription>
          </div>
          <Button asChild variant="secondary">
            <Link href="/developers">서비스 키 관리</Link>
          </Button>
        </div>

        <WorkflowApiList workflows={workflows} baseUrl={baseUrl} />
      </PageStack>
    </PageContainer>
  );
}
