"use client";

import {
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HandCoins,
  type LucideProps,
  StickyNote,
  Store,
  Workflow,
} from "lucide-react";
import { SiteHeader } from "@/app/_components/site-header/site-header";
import { LocaleSelectorButton } from "@/components/locale-selector-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

type NavType =
  | {
      type: "Item";
      name: string;
      href: string;
      icon: LucideIcon;
    }
  | {
      type: "Separator";
      name?: undefined;
      href?: undefined;
      icon?: undefined;
    };

const navigation: NavType[] = [
  { type: "Item", name: "워크플로우", href: "/app", icon: Workflow },
  { type: "Item", name: "마켓플레이스", href: "/presets", icon: Store },
  { type: "Separator" },
  { type: "Item", name: "문서", href: "/docs", icon: StickyNote },
  { type: "Item", name: "크레딧", href: "/credits", icon: HandCoins },
];

interface MainLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <aside className="flex w-20 flex-col items-center gap-2 border-r border-border bg-card bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 py-6 dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800">
        <Link href="/" className="mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl">
            LOGO
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-2 space-y-1">
          {navigation.map((item, index) => {
            if (item.type === "Separator") {
              return (
                <Separator
                  key={"Separator" + index}
                  className="my-2 bg-neutral-50/50 dark:bg-neutral-200/50"
                />
              );
            }

            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className="group flex cursor-pointer flex-col items-center transition-all"
              >
                <Button
                  className={cn(
                    "h-8 w-8 cursor-pointer bg-transparent text-neutral-50 dark:text-neutral-200",
                    isActive
                      ? "bg-neutral-700/30 group-hover:bg-neutral-700/30 hover:bg-neutral-700/30 dark:bg-neutral-600"
                      : "bg-transparent group-hover:bg-neutral-700/20 hover:bg-neutral-700/20 dark:group-hover:bg-neutral-700 dark:hover:bg-neutral-700",
                  )}
                >
                  <item.icon className="size-5" strokeWidth={1.75} />
                </Button>
                <div className="text-[10px] text-neutral-50 dark:text-neutral-200">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="space-y-3 text-center">
          <LocaleSelectorButton />
          <div className="px-2">
            <p className="text-[10px] leading-tight text-muted-foreground">
              © 2026
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              Designer
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background">
        <SiteHeader />
        {children}
      </main>
    </div>
  );
}
