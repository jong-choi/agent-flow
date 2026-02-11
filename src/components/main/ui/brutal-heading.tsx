import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-black uppercase italic tracking-tighter", {
  variants: {
    variant: {
      hero: "text-7xl leading-[0.75] md:text-8xl lg:text-9xl",
      h2: "text-5xl leading-none md:text-7xl mb-8",
      h3: "text-3xl font-black uppercase italic mb-4",
      h4: "text-xl font-black uppercase italic mb-2",
      label:
        "text-3xl font-black tracking-widest uppercase italic text-brutal-muted-foreground mb-8 md:text-5xl",
    },
  },
  defaultVariants: {
    variant: "h2",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
}

function BrutalHeading({ className, variant, as, ...props }: HeadingProps) {
  const Comp = as || (variant === "hero" ? "h1" : "h2");
  return (
    <Comp className={cn(headingVariants({ variant, className }))} {...props} />
  );
}

export { BrutalHeading, headingVariants };
