import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SidebarContainer({ children }: { children: React.ReactNode }) {
  return (
    <Card className="z-10 h-full min-w-100 px-3 py-5">
      <CardHeader className="p-2 py-0">
        <CardTitle>사이드바</CardTitle>
        <CardDescription>Draggable 객체의 목록</CardDescription>
      </CardHeader>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}
