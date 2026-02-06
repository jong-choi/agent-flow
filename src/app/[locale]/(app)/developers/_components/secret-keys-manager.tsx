"use client";

import { useId, useState, useTransition } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  type UserSecretSummary,
  createUserSecretAction,
  softDeleteUserSecretAction,
} from "@/db/query/secrets";
import { cn, formatKoreanDate } from "@/lib/utils";

type SecretKeysManagerProps = {
  initialSecrets: UserSecretSummary[];
};

export function SecretKeysManager({ initialSecrets }: SecretKeysManagerProps) {
  const [secrets, setSecrets] = useState<UserSecretSummary[]>(initialSecrets);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const canCreate = !isPending;

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const created = await createUserSecretAction();
        setSecrets((prev) => [
          {
            id: created.id,
            preview: created.preview,
            createdAt: created.createdAt,
            lastUsedAt: null,
          },
          ...prev,
        ]);
        setNewSecret(created.secret);
        setDialogOpen(true);
      } catch (error) {
        console.error(error);
        toast.error("시크릿 키 발급에 실패했습니다.");
      }
    });
  };

  const handleCopyNewSecret = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    toast.success("복사되었습니다.");
  };

  const handleDelete = (secretId: string) => {
    startTransition(async () => {
      try {
        await softDeleteUserSecretAction({ secretId });
        setSecrets((prev) => prev.filter((s) => s.id !== secretId));
        toast.success("삭제되었습니다.");
      } catch (error) {
        console.error(error);
        toast.error("삭제에 실패했습니다.");
      }
    });
  };

  const empty = secrets.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {empty ? "발급된 키가 없습니다." : `발급된 키 ${secrets.length}개`}
        </div>
        <Button onClick={handleCreate} disabled={!canCreate} size="sm">
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          새 키 발급
        </Button>
      </div>

      <ScrollArea className="h-56 rounded-md bg-accent/40">
        {empty ? (
          <div className="my-auto flex h-56 items-center justify-center text-xs text-muted-foreground">
            발급된 키가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {secrets.map((secret) => (
              <div
                key={secret.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
                  <div className="truncate font-mono text-sm">
                    {secret.preview}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>발급 {formatKoreanDate(secret.createdAt)}</span>
                    <span className={cn(!secret.lastUsedAt && "hidden")}>
                      최근 사용 {formatKoreanDate(secret.lastUsedAt)}
                    </span>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        시크릿 키를 삭제할까요?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        삭제하면 외부 서비스에서 더 이상 사용할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isPending}>
                        취소
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(secret.id)}
                        disabled={isPending}
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <NewSecretDialog
        open={dialogOpen}
        onOpenChange={(next) => {
          setDialogOpen(next);
          if (!next) {
            setNewSecret(null);
          }
        }}
        secret={newSecret}
        onCopy={handleCopyNewSecret}
      />
    </div>
  );
}

function NewSecretDialog({
  open,
  onOpenChange,
  secret,
  onCopy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: string | null;
  onCopy: () => void;
}) {
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ariaDescribedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>새 시크릿 키</DialogTitle>
          <DialogDescription id={descriptionId}>
            이 키는 지금만 확인할 수 있습니다. 안전한 곳에 복사해 두세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="rounded-md border bg-muted p-3 font-mono text-sm">
            {secret ?? "키 발급에 실패했습니다."}
          </div>
          <p className="text-xs text-muted-foreground">
            화면에 노출되는 키는 발급 시 1회만 제공됩니다.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onCopy}
            disabled={!secret}
          >
            <Copy className="size-4" />
            복사
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
