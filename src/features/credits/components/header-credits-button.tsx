import Link from "next/link";
import { Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCreditBalance } from "@/features/credits/server/queries";

export async function HeaderCreditsButton() {
  const balance = await getCreditBalance();

  return (
    <div className="flex items-center rounded-lg border bg-muted p-1">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-6 min-w-17 bg-background text-xs shadow-sm hover:bg-background"
      >
        <Link href="/credits" aria-label="View credits">
          <Sparkle className="size-3 fill-current" />
          <span>{balance}</span>
        </Link>
      </Button>
    </div>
  );
}
