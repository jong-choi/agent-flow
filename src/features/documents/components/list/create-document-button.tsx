"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createDocumentAction } from "@/features/documents/server/actions";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function CreateDocumentButton() {
  const t = useTranslations<AppMessageKeys>("Docs");
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();
  const handleCreate = () => {
    startCreateTransition(async () => {
      const id = await createDocumentAction();
      if (id) {
        router.push(`/docs/${id}?edit=true`);
      }
    });
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating}>
      {isCreating ? (
        <Spinner className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
      {t("listPage.createDocument")}
    </Button>
  );
}
