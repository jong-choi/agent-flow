import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PagerButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  direction: "prev" | "next";
  href?: string;
};

export function PagerButton({
  href,
  direction,
  className,
  disabled,
  ...props
}: PagerButtonProps) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Prev" : "Next";
  const content = (
    <>
      {direction === "prev" && <Icon className="h-4 w-4" />}
      {label}
      {direction === "next" && <Icon className="h-4 w-4" />}
    </>
  );

  if (href && !disabled) {
    return (
      <Button variant="ghost" asChild className={className} {...props}>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      type="button"
      className={className}
      disabled={disabled}
      {...props}
    >
      {content}
    </Button>
  );
}
