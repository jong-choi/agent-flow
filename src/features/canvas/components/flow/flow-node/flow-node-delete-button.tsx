import { useCallback } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";

export function FlowNodeDeleteButton({ id }: { id: string }) {
  const { deleteElements } = useCanvasReactFlow();
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  const handleDeleteNode = useCallback(async () => {
    await deleteElements({ nodes: [{ id }] });

    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  }, [deleteElements, id, selectedNodeId, setSelectedNodeId]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="absolute top-1 right-1 size-6 p-0 text-muted-foreground"
          aria-label="delete node"
        >
          <X />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>노드를 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription className="hidden">
            삭제하려면 “삭제”를 선택해 주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteNode}>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
