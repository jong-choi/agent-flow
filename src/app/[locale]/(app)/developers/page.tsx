import Link from "next/link";
import {
  PageContainer,
  PageDescription,
  PageHeader,
  PageHeading,
  PageStack,
} from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiGuideMarkdown } from "@/features/developers/components/api-guide-markdown";
import { SecretKeysManager } from "@/features/developers/components/secret-keys-manager";
import { getUserSecrets } from "@/features/developers/server/queries";

export default async function DevelopersPage({
  params,
}: PageProps<"/[locale]/developers">) {
  const { locale } = await params;
  const secrets = await getUserSecrets();

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader>
            <PageHeading>Developer API</PageHeading>
            <PageDescription>
              서비스 키를 발급하고 워크플로우를 외부에서 실행할 수 있습니다.
            </PageDescription>
          </PageHeader>
          <Button asChild variant="secondary">
            <Link href="/developers/apis">워크플로우 API</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>서비스 키</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              API 호출 시 <code>X-CANVAS-SECRET</code> 헤더로 전달합니다. 키는
              발급 시 1회만 노출됩니다.
            </p>
            <SecretKeysManager initialSecrets={secrets} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat API 사용 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiGuideMarkdown locale={locale} />
          </CardContent>
        </Card>
      </PageStack>
    </PageContainer>
  );
}
