import { ArrowRight } from "lucide-react";
import { type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type HomeQuickLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
  className?: string;
  arrowSize?: number;
};

export function HomeQuickLink({
  href,
  label,
  className,
  arrowSize = 16,
}: HomeQuickLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn("rounded-full", className)}
    >
      <Link href={href}>
        {label}
        <ArrowRight size={arrowSize} />
      </Link>
    </Button>
  );
}
