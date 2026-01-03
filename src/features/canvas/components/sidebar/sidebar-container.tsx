import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SidebarContainer({ children }: { children: React.ReactNode }) {
  return (
    <Card className="min-h-0 shrink">
      <CardHeader className="px-4 py-0">
        <CardTitle>사이드바</CardTitle>
        <CardDescription>Draggable 객체의 목록</CardDescription>
      </CardHeader>
      <div className="scrollbar-slim flex flex-col gap-4 overflow-y-scroll px-2 pb-4">
        {children}
      </div>
    </Card>
  );
}
