## Dnd Context

### id

`useId` : React 18의 훅. 훅 별로 고유한 ID를 만들어 Hydration 시에도 동일한 값을 유지함.
`DndContext.id` : `SSR mismatch` 를 위해 추가된 Props. useId를 통해 생성한 id값을 넘겨주면 `aria-` 등에 해당 아이디를 통해 매치함

```tsx
"use client";

export default function CanvasPage() {
  const dndId = useId();

  return (
      <DndContext id={dndId} onDragEnd={handleDragEnd}>

      </DndContext>
  );
}
```

## handlers

`src/features/canvas/dnd/utils/handlers.ts` 에 선언한 후, 필요한 경우 해당 폴더에 대해 유닛테스트 진행할 것

```tsx
export const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
}
```

`active`는 드래그하던 요소, `over`는 droppable 요소.

## useDraggable

`useDraggable`의 파라미터는 `{id, data?, attributes?, disabled?}` 형식의 객체를 받는다.
id는 고유해야 하며,  
각 요소마다 useDraggable을 선언해야 한다.

`useDraggable`은 `attributes`, `listeners`, `setNodeRef`, `transform`, `isDragging` 등을 반환한다.  
드래그할 요소에 `attributes`, `listeners`, `setNodeRef`를 구조분해 할당으로 넘겨주고,  
드래그시 위치를 실제로 옮기기 위해 `transform`을 이용한 스타일 객체를 생성하여 넘겨준다.

```tsx
export function DraggableItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: item,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      {/* `attributes`, `listeners`, `setNodeRef` 넘겨주기 */}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      {/* `transform`으로 생성된 스타일 객체 넘겨주기 */}
      style={style}
      className="w-full cursor-pointer p-2 px-0"
    />
  );
}
```

## useDroppable

`useDroppable`은 드롭 이벤트가 발생할 공간에 대한 ref를 반환한다.  
`Droppable` 객체에 드롭이 발생하면 `Context`의 dragEnd 이벤트 함수가 실행된다.

```tsx
export function DroppableZone({ children }: { children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({
    id: "canvas-dropzone",
  });

  return (
    <div
      ref={setNodeRef}
      className={`${
        isOver ? "border-primary bg-muted" : "border-border bg-muted/50"
      }`}
    >
      {children}
    </div>
  );
}
```
