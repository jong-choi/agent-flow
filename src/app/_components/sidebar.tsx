"use client";

import {
  type ForwardRefExoticComponent,
  type RefAttributes,
  Suspense,
} from "react";
import {
  Blocks,
  BotMessageSquare,
  CircleUserRound,
  HandCoins,
  KeyRound,
  type LucideProps,
  StickyNote,
  Workflow,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { BrutalCI } from "@/components/main/ui/brutal-logo";
import { SidebarContainer } from "@/components/sidebar-container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type LucideIcon = ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
>;

type NavItem = {
  type: "Item";
  name: string;
  href: string;
  Icon: LucideIcon;
  children?: Array<{
    name: string;
    href: string;
  }>;
};

type NavSeparator = {
  type: "Separator";
};

type NavType = NavItem | NavSeparator;
type SidebarTranslator = ReturnType<typeof useTranslations>;

const createNavigation = (t: SidebarTranslator): NavType[] => [
  {
    type: "Item",
    name: t("nav.workflows"),
    href: "/workflows",
    Icon: Workflow,
  },
  { type: "Item", name: t("nav.chat"), href: "/chat", Icon: BotMessageSquare },
  { type: "Separator" },
  {
    type: "Item",
    name: t("nav.presets"),
    href: "/presets",
    Icon: Blocks,
    children: [
      { name: t("presets.market"), href: "/presets" },
      { name: t("presets.myPresets"), href: "/presets/purchased" },
      { name: t("presets.createPreset"), href: "/presets/new" },
    ],
  },
  { type: "Item", name: t("nav.docs"), href: "/docs", Icon: StickyNote },
  { type: "Separator" },
  {
    type: "Item",
    name: t("nav.credits"),
    href: "/credits",
    Icon: HandCoins,
    children: [
      { name: t("credits.home"), href: "/credits" },
      { name: t("credits.history"), href: "/credits/history" },
      { name: t("credits.attendance"), href: "/credits/attendance" },
    ],
  },
  {
    type: "Item",
    name: t("nav.profile"),
    href: "/profile",
    Icon: CircleUserRound,
  },
  { type: "Separator" },
  {
    type: "Item",
    name: t("nav.api"),
    href: "/developers",
    Icon: KeyRound,
    children: [
      { name: t("api.serviceKey"), href: "/developers" },
      { name: t("api.workflowApi"), href: "/developers/apis" },
    ],
  },
];

const HIDE_SIDEBAR_PATHS = new Set<string>(["/", "/login"]);

export function SidebarNav() {
  return (
    <aside className="sticky top-0 flex h-screen w-20 flex-col items-center gap-2 bg-brutal-primary pb-6 text-brutal-primary-foreground dark:bg-neutral-800">
      <div className="py-4">
        <BrutalCI className="text-neutral-50" />
      </div>
      <Suspense fallback={null}>
        <SidebarNavContent />
      </Suspense>
      <div className="mt-auto space-y-3 text-center">
        <div className="px-2">
          <p className="text-[10px] leading-tight text-neutral-50/90 dark:text-neutral-300">
            © 2026
          </p>
          <p className="text-[10px] leading-tight text-neutral-50/90 dark:text-neutral-300">
            AgentFlow
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavContent() {
  const session = useSession();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations<AppMessageKeys>("Sidebar");
  const navigation = createNavigation(t);

  if (!session.data?.user && HIDE_SIDEBAR_PATHS.has(pathname)) {
    return null;
  }

  return (
    <nav
      className="flex flex-1 flex-col items-center gap-2 space-y-1"
      key={locale}
    >
      {navigation.map((item, index) => {
        if (item.type === "Separator") {
          return <Separator key={"Separator" + index} className="my-2" />;
        }

        const isActive = pathname?.startsWith(item.href);
        const ItemIcon = item.Icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            title={item.name}
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
            className="group flex min-h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-md transition-all"
            prefetch
            locale={locale}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-md bg-transparent text-neutral-50 dark:text-neutral-200",
                isActive
                  ? "bg-neutral-300/30 group-hover:bg-neutral-300/30 hover:bg-neutral-300/30 dark:bg-neutral-600"
                  : "bg-transparent group-hover:bg-neutral-400/20 hover:bg-neutral-400/20 dark:group-hover:bg-neutral-700 dark:hover:bg-neutral-700",
              )}
            >
              <ItemIcon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="text-[10px] text-neutral-50 dark:text-neutral-200">
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SecondarySidebar() {
  return (
    <Suspense fallback={null}>
      <SecondarySidebarContent />
    </Suspense>
  );
}

function SecondarySidebarContent() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations<AppMessageKeys>("Sidebar");
  const navigation = createNavigation(t);
  const activeNavItem = navigation.find(
    (item): item is NavItem =>
      item.type === "Item" &&
      Boolean(item.children?.length) &&
      pathname?.startsWith(item.href),
  );

  if (!activeNavItem?.children?.length) return <SidebarContainer invisible />;
  const ActiveIcon = activeNavItem.Icon;

  return (
    <SidebarContainer key={locale}>
      <div className="flex shrink-0 items-center gap-2 px-4 text-xs font-extrabold text-muted-foreground">
        <ActiveIcon className="size-4" strokeWidth={1.75} />
        {activeNavItem.name}
      </div>

      <ScrollArea className="mt-4 min-h-0 flex-1 px-4">
        <nav className="flex flex-col gap-1">
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
                locale={locale}
              >
                {child.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </SidebarContainer>
  );
}
