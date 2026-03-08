import { Suspense as ReactSuspense } from "react";
import { cn } from "@/lib/utils";

type FadeSuspenseProps = React.ComponentProps<typeof ReactSuspense> & {
  fallbackClassName?: string;
};

function FallbackFadeIn({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="fallback-fade-in"
      className={cn(
        "animate-in delay-150 duration-500 fill-mode-backwards fade-in",
        className,
      )}
      {...props}
    />
  );
}

function FadeSuspense({
  fallback,
  fallbackClassName,
  ...props
}: FadeSuspenseProps) {
  const resolvedFallback =
    fallback == null ? null : (
      <FallbackFadeIn className={fallbackClassName}>{fallback}</FallbackFadeIn>
    );

  return <ReactSuspense fallback={resolvedFallback} {...props} />;
}

export { FadeSuspense };
