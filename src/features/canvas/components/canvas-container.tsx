export function CanvasContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-bold">Canvas 이름</h1>
        <p className="text-sm text-muted-foreground">Canvas 설명</p>
      </div>
      {children}
    </div>
  );
}
