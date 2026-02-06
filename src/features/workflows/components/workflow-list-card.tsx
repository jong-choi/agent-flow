import Link from "next/link";
import { BoringCardAvatar } from "@/components/boring-avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatKoreanDate } from "@/lib/utils";

type WorkflowListCardProps = {
  href: string;
  title: string;
  description?: string | null;
  updatedAt: Date;
  actionLabel?: string;
  workflowId: string;
};

export function WorkflowListCard({
  href,
  title,
  description,
  updatedAt,
  actionLabel,
  workflowId,
}: WorkflowListCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full gap-3 transition-shadow group-hover:bg-primary/5 group-hover:shadow-md">
        <CardHeader className="-mb-2">
          <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between">
          <CardDescription className="line-clamp-2 min-h-10 flex-1">
            {description ?? "설명이 없습니다."}
          </CardDescription>
        </CardContent>
        <CardFooter className="mt-auto flex items-end justify-between">
          <div className="shrink-0">
            <BoringCardAvatar
              seed={workflowId}
              variant="bauhaus"
              className="size-8"
              square={false}
            />
          </div>
          <div className="flex flex-col items-end text-xs text-muted-foreground">
            {!!actionLabel && (
              <span className="hidden text-primary group-hover:block">
                {actionLabel}
              </span>
            )}
            <span>최근 업데이트 {formatKoreanDate(updatedAt)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
