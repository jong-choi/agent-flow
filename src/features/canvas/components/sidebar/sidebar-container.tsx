import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <div className="scrollbar-slim flex flex-col gap-4 overflow-y-scroll px-2 pb-4">
        {children}
      </div>
    </Card>
  );
}
