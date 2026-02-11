import Link from "next/link";
import { Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCreditBalance } from "@/features/credits/server/queries";

export async function HeaderCreditsButton() {
  const balance = await getCreditBalance();

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-7 min-w-18 text-xs"
      title="현재 크레딧"
    >
      <Link
        href="/credits"
        aria-label="View credits"
        className="flex items-center"
      >
        <Sparkle className="size-3 fill-current" />
        <span>{balance}</span>
      </Link>
    </Button>
  );
}
