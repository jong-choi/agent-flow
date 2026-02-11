import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-block border-2 text-[10px] font-black uppercase italic",
  {
    variants: {
      variant: {
        default:
          "border-brutal-border px-4 py-2 shadow-[4px_4px_0px_currentColor]",
        solid:
          "border-brutal-foreground bg-brutal-foreground text-brutal-background shadow-[4px_4px_0px_currentColor]",
        outline: "border-current opacity-40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {}

function BrutalTag({ className, variant, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ variant, className }))} {...props} />
  );
}

export { BrutalTag, tagVariants };
