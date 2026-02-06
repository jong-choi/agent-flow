"use client";

import Link from "next/link";
import { Sparkle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type CreditsBalanceResult = {
  balance: number;
};

async function getCreditsBalance(): Promise<number | null> {
  const res = await fetch("/api/credits");
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch credits balance (${res.status}).`);
  }
  const json = (await res.json()) as CreditsBalanceResult;
  return json.balance;
}

export function CreditsButton() {
  const { data, isLoading } = useQuery({
    queryKey: ["credits", "balance"],
    queryFn: getCreditsBalance,
  });

  if (isLoading) {
    return <Skeleton className="h-8 w-19 rounded-lg" />;
  }

  if (typeof data !== "number") return null;

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
          <span>{data}</span>
        </Link>
      </Button>
    </div>
  );
}
