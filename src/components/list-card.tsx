import { cn } from "@/lib/utils";

function ListCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-lg border p-4", className)} {...props} />
  );
}

function ListCardRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function ListCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

function ListCardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function ListCardTitle({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("font-medium", className)} {...props} />;
}

function ListCardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function ListCardDate({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-xs text-muted-foreground", className)} {...props} />
  );
}

function ListCardAmount({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />;
}

export {
  ListCard,
  ListCardRow,
  ListCardContent,
  ListCardMeta,
  ListCardTitle,
  ListCardDescription,
  ListCardDate,
  ListCardAmount,
};
