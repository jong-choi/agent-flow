"use client";

import {
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
  useId,
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

type NavItem = {
  type: "Item";
  name: string;
  href: string;
  icon: LucideIcon;
  children?: Array<{
    name: string;
    href: string;
  }>;
};

type NavSeparator = {
  type: "Separator";
};

type NavType = NavItem | NavSeparator;

const navigation: NavType[] = [
  { type: "Item", name: "워크플로우", href: "/app", icon: Workflow },
  { type: "Item", name: "마켓플레이스", href: "/presets", icon: Store },
  { type: "Separator" },
  { type: "Item", name: "문서", href: "/docs", icon: StickyNote },

  {
    type: "Item",
    name: "크레딧",
    href: "/credits",
    icon: HandCoins,
    children: [
      { name: "홈", href: "/credits" },
      { name: "출석", href: "/credits/attendance" },
      { name: "히스토리", href: "/credits/history" },
    ],
  },
];

interface MainLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const id = useId();
  const activeNavItem = navigation.find(
    (item): item is NavItem =>
      item.type === "Item" &&
      Boolean(item.children?.length) &&
      pathname?.startsWith(item.href),
  );

  return (
    <div className="flex h-screen" id={id}>
      <aside className="flex w-20 flex-col items-center gap-2 border-r border-border bg-card bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900 py-6 dark:border-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800">
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
                      ? "bg-neutral-300/30 group-hover:bg-neutral-300/30 hover:bg-neutral-300/30 dark:bg-neutral-600"
                      : "bg-transparent group-hover:bg-neutral-400/20 hover:bg-neutral-400/20 dark:group-hover:bg-neutral-700 dark:hover:bg-neutral-700",
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
      <main className="flex flex-1 flex-col overflow-auto bg-background">
        <SiteHeader />
        <div className="flex h-full w-full overflow-auto">
          {activeNavItem?.children?.length ? (
            <aside className="fixed h-full w-52 border-r border-border bg-background/80 px-4 py-6 backdrop-blur">
              <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
                <activeNavItem.icon className="size-4" strokeWidth={1.75} />
                {activeNavItem.name}
              </div>
              <nav className="mt-4 flex flex-col gap-1">
                {activeNavItem.children.map((child) => {
                  const isRoot = child.href === activeNavItem.href;
                  const isActive = isRoot
                    ? pathname === child.href
                    : pathname?.startsWith(child.href);

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                        isActive && "bg-muted text-foreground",
                      )}
                    >
                      {child.name}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
