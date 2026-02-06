import Link from "next/link";
import { Palette } from "lucide-react";

export function LogoIcon({
  variant = "gradient",
  size = "md",
}: {
  variant?: "gradient" | "glass";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  const iconSizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-6",
  };

  if (variant === "glass") {
    return (
      <div
        className={`flex ${sizeClasses[size]} -rotate-6 items-center justify-center rounded border border-white/30 bg-white/20 backdrop-blur-sm`}
      >
        <Palette className={`${iconSizeClasses[size]} text-white`} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClasses[size]} -rotate-6 items-center justify-center rounded bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 dark:from-fuchsia-900 dark:via-purple-800 dark:to-indigo-800`}
    >
      <Palette className={`${iconSizeClasses[size]} text-white`} />
    </div>
  );
}

export function Logo() {
  return (
    <Link href="/" className="group">
      <div className="flex items-center gap-2 border-purple-600/20 bg-white px-3 py-1.5 hover:bg-purple-50 dark:border-white/20 dark:bg-white/10 dark:backdrop-blur-sm dark:hover:bg-white/20">
        <LogoIcon />
        <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 bg-clip-text text-sm font-bold text-transparent dark:bg-none dark:text-white">
          AgentFlow
        </span>
      </div>
    </Link>
  );
}
