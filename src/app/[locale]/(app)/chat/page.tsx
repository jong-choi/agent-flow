import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { PageHeading } from "@/components/page-template";
import { Button } from "@/components/ui/button";
import { getRecentWorkflows } from "@/db/query/workflows";
import { cn, formatKoreanDate } from "@/lib/utils";

export default async function Page() {
  const { data, hasMore } = await getRecentWorkflows();

  return (
    <div className="my-auto flex h-4/5 min-h-[600px] flex-col items-center gap-16">
      <PageHeading>워크플로우를 선택하여 채팅을 시작하세요.</PageHeading>
      {data.length && (
        <div className="flex w-3/5 min-w-[450px] flex-col gap-8">
          <div className="grid grid-cols-3 gap-4">
            {data.map((workflow) => {
              return (
                <div
                  className="flex flex-col gap-1 rounded-lg border border-border/60 bg-background p-4"
                  key={workflow.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {workflow.title}
                    </div>
                    <div className="shrink-0 text-xs text-muted-foreground">
                      업데이트 {formatKoreanDate(workflow.updatedAt)}
                    </div>
                  </div>
                  <div className="truncate text-sm text-foreground/80">
                    {workflow.description}
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <Button size="sm" type="button">
                      <Play />
                      채팅 시작
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/chat/workflows/${workflow.id}`}>
                        <ChevronRight />
                        상세보기
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {hasMore && (
        <Button asChild>
          <Link href="/chat/workflows">더보기</Link>
        </Button>
      )}
      {!data.length && (
        <>
          <div className="font-semibold text-muted-foreground">
            저장된 워크플로우가 없습니다.
          </div>
          <Button asChild>
            <Link href="/canvas">워크플로우 생성하기</Link>
          </Button>
        </>
      )}
    </div>
  );
}
