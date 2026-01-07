import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
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
import { useSetSearchParams } from "@/features/canvas/hooks/use-set-search-params";

export function FlowNodeDeleteButton({ id }: { id: string }) {
  const { deleteElements } = useReactFlow();
  const setSearchParams = useSetSearchParams();
  const searchParams = useSearchParams();

  const handleDeleteNode = useCallback(async () => {
    await deleteElements({ nodes: [{ id }] });

    if (searchParams.get("node_id") === id) {
      setSearchParams({ node_id: null });
    }
  }, [deleteElements, id, searchParams, setSearchParams]);

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
