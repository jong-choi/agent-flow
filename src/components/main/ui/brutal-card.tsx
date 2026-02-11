import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("border-2 transition-colors", {
  variants: {
    variant: {
      default: "border-brutal-border bg-brutal-background ",
      muted: "border-brutal-border bg-brutal-muted/20",
      filled: "border-brutal-border bg-brutal-muted text-brutal-foreground",
      inverse:
        "border-brutal-border bg-brutal-foreground text-brutal-background",
      outline: "border-brutal-border hover:border-brutal-foreground",
    },
    padding: {
      default: "p-8",
      lg: "p-10",
      sm: "p-4",
      none: "p-0",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "default",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function BrutalCard({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, padding, className }))}
      {...props}
    />
  );
}

export { BrutalCard, cardVariants };
