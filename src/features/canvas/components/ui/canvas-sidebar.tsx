import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CanvasSidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="fixed top-16 left-6 z-10 w-60">
      <Card className="px-3 py-5">
        <CardHeader className="p-2 py-0">
          <CardTitle>사이드바</CardTitle>
          <CardDescription>Draggable 객체의 목록</CardDescription>
        </CardHeader>
        <div className="space-y-2">{children}</div>
      </Card>
    </aside>
  );
}
