import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type FlowNodeData } from "@/db/types/sidebar-nodes";
import { DocumentReferenceDialog } from "@/features/canvas/components/flow/document-reference/document-reference-dialog";
import { useCanvasReactFlow } from "@/features/canvas/hooks/use-canvas-react-flow";
import { useCanvasStore } from "@/features/canvas/store/canvas-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function FlowNodeContent({
  content,
  id,
  nodeType,
}: {
  content: FlowNodeData["content"];
  id: string;
  nodeType?: string;
}) {
  const locale = useLocale();
  const t = useTranslations<AppMessageKeys>("Workflows");
  const { updateNodeData } = useCanvasReactFlow();
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);

  if (!content) return null;

  const handleValueChange = (value: string) => {
    requestAnimationFrame(() => setSelectedNodeId(null));
    updateNodeData(id, { content: { ...content, value } });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = String(formData.get("textValue") ?? "");
    handleValueChange(value);
    toast.success(t("canvas.node.savedToast"));
  };

  if (content.type === "select") {
    return (
      <div className="flex flex-col gap-2">
        <Select
          onValueChange={handleValueChange}
          value={content.value || undefined}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={content.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{content.label} </SelectLabel>
              {content.options?.map((option) => {
                const optionLabel =
                  nodeType === "documentNode" && locale !== "ko"
                    ? option.id
                    : option.value;

                return (
                  <SelectItem value={option.value} key={option.id}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{optionLabel}</span>
                      {typeof option.price === "number" ? (
                        <span className="right-0 text-xs text-muted-foreground">
                          x{option.price}
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>

        {nodeType === "documentNode" ? (
          <DocumentReferenceDialog
            referenceId={content.referenceId}
            onChange={(nextReferenceId) => {
              updateNodeData(id, {
                content: { ...content, referenceId: nextReferenceId },
              });
              requestAnimationFrame(() => setSelectedNodeId(null));
            }}
          />
        ) : null}
      </div>
    );
  }

  if (content.type === "dialog") {
    return (
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              {content.label}
            </Button>
          </DialogTrigger>
          <DialogTitle className="sr-only">
            {t("canvas.node.editDialogSrOnly")}
          </DialogTitle>
          <DialogContent
            className="sm:max-w-md"
            ariaDescribedby="node edit dialog"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>{content.dialogTitle}</DialogTitle>
                <DialogDescription>
                  {content.dialogDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <div className="grid flex-1 gap-2">
                  <Textarea
                    name="textValue"
                    className="h-[400px]"
                    defaultValue={content.value || undefined}
                  />
                </div>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    {t("canvas.node.close")}
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit">{t("canvas.node.save")}</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
