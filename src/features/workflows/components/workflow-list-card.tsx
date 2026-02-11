import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  WorkflowAvatar,
  WorkflowDescriptionText,
  WorkflowTitleText,
  WorkflowUpdatedAtText,
} from "@/components/workflow/workflow-summary-parts";

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
          <WorkflowTitleText title={title} className="line-clamp-1 text-lg" />
        </CardHeader>
        <CardContent className="flex justify-between">
          <WorkflowDescriptionText
            description={description}
            className="line-clamp-2 min-h-10 flex-1 text-muted-foreground"
          />
        </CardContent>
        <CardFooter className="mt-auto flex items-end justify-between">
          <div className="shrink-0">
            <WorkflowAvatar workflowId={workflowId} />
          </div>
          <div className="flex min-h-10 flex-col-reverse items-end text-xs text-muted-foreground">
            <WorkflowUpdatedAtText updatedAt={updatedAt} />
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
