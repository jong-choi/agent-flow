import { cn } from "@/lib/utils";

function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "container mx-auto max-w-5xl items-center px-4 pt-8 pb-32",
        className,
      )}
      {...props}
    />
  );
}

function PageStack({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-8", className)} {...props} />;
}

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(className)} {...props} />;
}

function PageHeading({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("mb-2 text-2xl leading-none font-bold", className)}
      {...props}
    />
  );
}

function PageSectionTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-xl leading-none font-semibold", className)}
      {...props}
    />
  );
}

function PageContentTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={cn("font-bold tracking-tight", className)} {...props} />
  );
}

function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export {
  PageContainer,
  PageHeader,
  PageStack,
  PageHeading,
  PageDescription,
  PageSectionTitle,
  PageContentTitle,
};
