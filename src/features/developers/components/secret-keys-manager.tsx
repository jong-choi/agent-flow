"use client";

import { useId, useState, useTransition } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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
  createUserSecretAction,
  getUserSecretsPageAction,
  softDeleteUserSecretAction,
} from "@/features/developers/server/actions";
import { type UserSecretPage } from "@/features/developers/server/queries";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { cn, formatYMD } from "@/lib/utils";

const SECRET_KEYS_PAGE_SIZE = 20;
const secretKeysQueryKey = ["developers", "secrets"] as const;

type SecretKeysManagerProps = {
  initialPage: UserSecretPage;
};

export function SecretKeysManager({ initialPage }: SecretKeysManagerProps) {
  const t = useTranslations<AppMessageKeys>("Developers");
  const queryClient = useQueryClient();
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: secretKeysQueryKey,
    queryFn: ({ pageParam }) =>
      getUserSecretsPageAction({
        cursor:
          typeof pageParam === "string" && pageParam
            ? pageParam
            : undefined,
        limit: SECRET_KEYS_PAGE_SIZE,
      }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.pageInfo.nextCursor ?? undefined,
    initialData: {
      pages: [initialPage],
      pageParams: [""],
    },
  });

  const secrets = data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const canCreate = !isPending && !isLoading;

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const created = await createUserSecretAction();
        await queryClient.invalidateQueries({ queryKey: secretKeysQueryKey });
        setNewSecret(created.secret);
        setDialogOpen(true);
      } catch (error) {
        console.error(error);
        toast.error(t("secretManager.toasts.createFailed"));
      }
    });
  };

  const handleCopyNewSecret = async () => {
    if (!newSecret) return;
    await navigator.clipboard.writeText(newSecret);
    toast.success(t("common.toasts.copied"));
  };

  const handleDelete = (secretId: string) => {
    startTransition(async () => {
      try {
        await softDeleteUserSecretAction({ secretId });
        await queryClient.invalidateQueries({ queryKey: secretKeysQueryKey });
        toast.success(t("common.toasts.deleted"));
      } catch (error) {
        console.error(error);
        toast.error(t("common.toasts.deleteFailed"));
      }
    });
  };

  const empty = secrets.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {empty
            ? t("secretManager.empty")
            : t("secretManager.issuedCount", { count: totalCount })}
        </div>
        <Button onClick={handleCreate} disabled={!canCreate} size="sm">
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {t("secretManager.issueButton")}
        </Button>
      </div>

      <ScrollArea className="h-56 rounded-md bg-accent/40">
        {isLoading ? (
          <div className="my-auto flex h-56 items-center justify-center text-xs text-muted-foreground">
            <Spinner className="size-4" />
          </div>
        ) : empty ? (
          <div className="my-auto flex h-56 items-center justify-center text-xs text-muted-foreground">
            {t("secretManager.empty")}
          </div>
        ) : (
          <div className="flex min-h-full flex-col py-1">
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
                      <span>
                        {t("secretManager.issuedAt", {
                          date: formatYMD(secret.createdAt),
                        })}
                      </span>
                      <span className={cn(!secret.lastUsedAt && "hidden")}>
                        {t("secretManager.lastUsedAt", {
                          date: formatYMD(secret.lastUsedAt),
                        })}
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
                        {t("secretManager.delete")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("secretManager.deleteDialog.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("secretManager.deleteDialog.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                          {t("common.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(secret.id)}
                          disabled={isPending}
                        >
                          {t("secretManager.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
            {hasNextPage ? (
              <div className="mt-auto flex justify-center pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage || isPending}
                >
                  {isFetchingNextPage ? <Spinner className="size-4" /> : null}
                  {t("secretManager.loadMore")}
                </Button>
              </div>
            ) : null}
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
  const t = useTranslations<AppMessageKeys>("Developers");
  const descriptionId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ariaDescribedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>{t("newSecretDialog.title")}</DialogTitle>
          <DialogDescription id={descriptionId}>
            {t("newSecretDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="rounded-md border bg-muted p-3 font-mono text-sm">
            {secret ?? t("newSecretDialog.issueFailed")}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("newSecretDialog.hint")}
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
            {t("common.copy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
