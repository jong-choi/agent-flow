import { cn } from "@/lib/utils";

export function SidebarContainer({
  children,
  invisible = false,
}: React.PropsWithChildren<{ invisible?: boolean }>) {
  return (
    <aside
      className={cn(
        "h-[calc(100dvh-3.5rem)] w-64 max-w-64 shrink-0",
        !invisible &&
          "sticky top-14 flex flex-col gap-2 border-r border-border py-6 backdrop-blur",
      )}
    >
      {children}
    </aside>
  );
}
