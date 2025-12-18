export function CanvasContentContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="ml-[18rem] flex-1 p-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Canvas 이름</h1>
          <p className="text-sm text-muted-foreground">Canvas 설명</p>
        </div>
      </div>
      {children}
    </main>
  );
}
