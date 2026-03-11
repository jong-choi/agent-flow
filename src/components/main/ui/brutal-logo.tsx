import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const logoVariants = cva(
  "inline-flex flex-col text-2xl leading-none font-black tracking-tighter uppercase italic",
  {
    variants: {
      variant: {
        default:
          "[&>span:first-child]:bg-brutal-background [&>span:first-child]:text-brutal-foreground [&>span:last-child]:bg-brutal-foreground [&>span:last-child]:text-brutal-background",
        inverse:
          "[&>span:first-child]:bg-brutal-foreground [&>span:first-child]:text-brutal-background [&>span:last-child]:bg-brutal-background [&>span:last-child]:text-brutal-foreground",
        muted:
          "[&>span:first-child]:bg-brutal-muted [&>span:first-child]:text-brutal-foreground [&>span:last-child]:bg-brutal-foreground [&>span:last-child]:text-brutal-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BrutalCIProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof logoVariants> {
  label?: string;
}

function BrutalCI({
  className,
  variant,
  label = "AF.",
  ...props
}: BrutalCIProps) {
  return (
    <Link href="/" className="cursor-pointer">
      <div className={cn(logoVariants({ variant, className }))} {...props}>
        <span className="px-1 py-2.5">{label}</span>
      </div>
    </Link>
  );
}

type BrutalLogoVariant = "default" | "inverse";

const brutalLogoVariantClasses: Record<
  BrutalLogoVariant,
  { container: string; flow: string }
> = {
  default: {
    container: "text-brutal-foreground",
    flow: "bg-brutal-foreground text-brutal-background",
  },
  inverse: {
    container: "text-brutal-background",
    flow: "bg-brutal-background text-brutal-foreground",
  },
};

export interface BrutalLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BrutalLogoVariant;
  leftLabel?: string;
  rightLabel?: string;
}

function BrutalLogo({
  className,
  variant = "default",
  leftLabel = "AGENT",
  rightLabel = "FLOW",
  ...props
}: BrutalLogoProps) {
  const palette = brutalLogoVariantClasses[variant];

  return (
    <Link href="/" className="cursor-pointer">
      <div
        className={cn(
          "inline-flex items-center pl-1 text-xl leading-none font-black tracking-tighter uppercase italic",
          palette.container,
          className,
        )}
        {...props}
      >
        <span>{leftLabel}</span>
        <span
          className={cn("inline-flex items-center py-0.5 pr-1", palette.flow)}
        >
          {rightLabel}
        </span>
      </div>
    </Link>
  );
}

export { BrutalCI, BrutalLogo, logoVariants };
