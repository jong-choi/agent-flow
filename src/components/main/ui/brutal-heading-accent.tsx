import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingAccentVariants = cva("mt-2 inline-block px-3", {
  variants: {
    variant: {
      default: "bg-brutal-muted text-brutal-foreground",
      inverse: "bg-brutal-background text-brutal-foreground pr-5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BrutalHeadingAccentProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof headingAccentVariants> {}

export function BrutalHeadingAccent({
  className,
  variant,
  ...props
}: BrutalHeadingAccentProps) {
  return (
    <span
      className={cn(headingAccentVariants({ variant, className }))}
      {...props}
    />
  );
}
