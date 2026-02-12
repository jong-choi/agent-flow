import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva("relative z-10 mx-auto", {
  variants: {
    variant: {
      default: "bg-brutal-background text-brutal-foreground",
      muted: "bg-brutal-muted text-brutal-foreground",
      inverse: "bg-brutal-foreground text-brutal-background",
    },
    container: {
      default: "max-w-7xl px-12 py-32",
      full: "w-full py-32",
      hero: "flex min-h-[85vh] max-w-7xl flex-col justify-center px-12",
    },
  },
  defaultVariants: {
    variant: "default",
    container: "default",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

function BrutalSection({
  className,
  variant,
  container,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(sectionVariants({ variant, container, className }))}
      {...props}
    />
  );
}

export { BrutalSection, sectionVariants };
