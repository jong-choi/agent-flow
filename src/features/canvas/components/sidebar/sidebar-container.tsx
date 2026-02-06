import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function SidebarContainer({
  children,
  className,
  footer,
  ...props
}: React.ComponentProps<"aside"> & { footer?: React.ReactNode }) {
  return (
    <aside
      className={cn("flex flex-col border bg-background", className)}
      {...props}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">{children}</div>
      </ScrollArea>
      {footer && <div className="border-t bg-muted/30 p-4">{footer}</div>}
    </aside>
  );
}
