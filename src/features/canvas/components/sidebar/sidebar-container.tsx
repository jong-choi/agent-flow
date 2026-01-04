import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SidebarContainer({
  children,
  className,
  title,
  description,
  ...props
}: React.ComponentProps<"div"> & { title: string; description: string }) {
  return (
    <Card className={className} {...props}>
      <CardHeader className="px-4 py-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 overflow-hidden px-2 pb-4">
          {children}
          {children}
        </div>
      </ScrollArea>
    </Card>
  );
}
