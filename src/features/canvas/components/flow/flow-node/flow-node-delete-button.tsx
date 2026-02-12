import { useCallback } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function FlowNodeDeleteButton({ id }: { id: string }) {
  const t = useTranslations<AppMessageKeys>("Workflows");
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
          aria-label={t("canvas.node.delete.ariaLabel")}
        >
          <X />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("canvas.node.delete.title")}</AlertDialogTitle>
          <AlertDialogDescription className="hidden">
            {t("canvas.node.delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("canvas.node.delete.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteNode}>
            {t("canvas.node.delete.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
