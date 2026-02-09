import { CalendarDays } from "lucide-react";
import { BoringCardAvatar } from "@/components/boring-avatar";
import { cn, formatKoreanDate } from "@/lib/utils";

type WorkflowTitleTextProps = {
  title: string;
  className?: string;
};

type WorkflowDescriptionTextProps = {
  description?: string | null;
  className?: string;
  fallbackText?: string;
};

type WorkflowUpdatedAtTextProps = {
  updatedAt: Date | string;
  className?: string;
  prefix?: string;
};

type WorkflowAvatarProps = {
  workflowId: string;
  className?: string;
};

export const WorkflowTitleText = ({
  title,
  className,
}: WorkflowTitleTextProps) => (
  <div
    className={cn(
      "min-w-0 truncate text-sm font-semibold text-foreground",
      className,
    )}
  >
    {title}
  </div>
);

export const WorkflowDescriptionText = ({
  description,
  className,
  fallbackText = "설명이 없습니다.",
}: WorkflowDescriptionTextProps) => (
  <div className={cn("line-clamp-2 text-sm text-foreground/80", className)}>
    {description ?? fallbackText}
  </div>
);

export const WorkflowUpdatedAtText = ({
  updatedAt,
  className,
  prefix,
}: WorkflowUpdatedAtTextProps) => (
  <span className={cn("text-xs text-muted-foreground", className)}>
    {!prefix ? <CalendarDays className="mb-1 inline-block size-3.5" /> : prefix}{" "}
    {formatKoreanDate(updatedAt)}
  </span>
);

export const WorkflowAvatar = ({
  workflowId,
  className,
}: WorkflowAvatarProps) => (
  <BoringCardAvatar
    seed={workflowId}
    variant="bauhaus"
    square={false}
    className={cn("size-8", className)}
  />
);
