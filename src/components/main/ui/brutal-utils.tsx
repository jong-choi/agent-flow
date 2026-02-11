import * as React from "react";
import { cn } from "@/lib/utils";

export function BrutalGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}
      {...props}
    />
  );
}

export function BrutalRadialGlow({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-brutal-background)_10%,transparent)_0,transparent_70%)]",
        className,
      )}
      {...props}
    />
  );
}

export function BrutalExpandLine({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "hover-expand-line h-[2px] w-0 bg-current transition-[width] duration-300 group-hover:w-full",
        className,
      )}
      {...props}
    />
  );
}
