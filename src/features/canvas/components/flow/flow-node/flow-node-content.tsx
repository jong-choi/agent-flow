import { toast } from "sonner";
import { useReactFlow } from "@xyflow/react";
import { type Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
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

export function FlowNodeContent({
  content,
  id,
}: {
  content: FlowNodeData["content"];
  id: string;
}) {
  const { updateNodeData } = useReactFlow<Node<FlowNodeData>>();

  if (!content) return null;

  const handleValueChange = (value: string) => {
    updateNodeData(id, { content: { ...content, value } });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = String(formData.get("textValue") ?? "");
    handleValueChange(value);
    toast.success("저장되었습니다.");
  };

  if (content.type === "select") {
    return (
      <CardContent className="-mt-4">
        <Select
          onValueChange={handleValueChange}
          value={content.value || undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder={content.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{content.label} </SelectLabel>
              {content.options?.map((option) => {
                return (
                  <SelectItem value={option.value} key={option.id}>
                    {option.value}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardContent>
    );
  }

  if (content.type === "dialog") {
    return (
      <CardContent className="-mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{content.label}</Button>
          </DialogTrigger>
          <DialogTitle className="sr-only">노드 수정 다이알로그</DialogTitle>
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
                    defaultValue={content.value || undefined}
                  />
                </div>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    닫기
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="submit">저장하기</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    );
  }

  return null;
}
