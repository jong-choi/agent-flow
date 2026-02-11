import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-black uppercase italic transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-brutal-foreground text-brutal-background hover:bg-brutal-muted-foreground hover:text-brutal-background shadow-[4px_4px_0px_currentColor]",
        outline:
          "border-2 border-brutal-border bg-transparent hover:bg-brutal-muted hover:text-brutal-foreground shadow-[4px_4px_0px_currentColor]",
        ghost: "hover:bg-brutal-muted hover:text-brutal-foreground",
        link: "text-brutal-primary underline-offset-4 hover:underline",
        nav: "border-2 border-brutal-border bg-brutal-background hover:bg-brutal-foreground hover:text-brutal-background shadow-[6px_6px_0px_currentColor]",
      },
      size: {
        default: "h-12 px-8 py-4",
        sm: "h-9 px-4 text-sm",
        lg: "h-16 px-16 text-3xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function BrutalButton({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { BrutalButton, buttonVariants };
