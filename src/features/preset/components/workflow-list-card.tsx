import Link from "next/link";
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
};

export function WorkflowListCard({
  href,
  title,
  description,
  updatedAt,
  actionLabel,
}: WorkflowListCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full gap-3 transition-shadow group-hover:bg-primary/5 group-hover:shadow-md">
        <CardHeader className="-mb-2">
          <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-12">
          <CardDescription className="line-clamp-2">
            {description ?? "설명이 없습니다."}
          </CardDescription>
        </CardContent>
        <CardFooter className="mt-auto">
          <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
            <span>최근 업데이트 {formatKoreanDate(updatedAt)}</span>
            {!!actionLabel && (
              <span className="hidden text-primary group-hover:block">
                {actionLabel}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
