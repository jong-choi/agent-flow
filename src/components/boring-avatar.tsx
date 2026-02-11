import { Suspense } from "react";
import { BoringAvatarClient } from "@/components/boring-avatar-client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BoringUserAvatar({
  seed = "default",
  size = 80,
  className = "",
  square = true,
}: {
  seed?: string;
  size?: number;
  className?: string;
  square?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <AvatarSkeleton size={size} square={square} className={className} />
      }
    >
      <BoringAvatarClient
        seed={seed}
        variant="beam"
        square={square}
        size={size}
        className={className}
      />
    </Suspense>
  );
}

export function BoringCardAvatar({
  seed = "default",
  size = 80,
  className = "",
  square = true,
  variant = "marble",
}: {
  seed?: string;
  size?: number;
  className?: string;
  square?: boolean;
  variant?: "bauhaus" | "marble";
}) {
  return (
    <Suspense
      fallback={
        <AvatarSkeleton size={size} square={square} className={className} />
      }
    >
      <BoringAvatarClient
        seed={seed}
        variant={variant}
        square={square}
        size={size}
        className={className}
      />
    </Suspense>
  );
}

function AvatarSkeleton({
  size,
  square,
  className,
}: {
  size: number;
  square: boolean;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn(square ? "rounded-md" : "rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}
