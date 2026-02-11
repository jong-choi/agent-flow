import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border-l-4 pl-4 text-xs font-black tracking-[0.5em] uppercase",
  {
    variants: {
      variant: {
        default: "border-brutal-foreground text-brutal-muted-foreground",
        inverse: "border-brutal-background text-brutal-muted-foreground",
        brand: "border-brutal-foreground text-brutal-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function BrutalBadge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { BrutalBadge, badgeVariants };
