"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createDocumentAction } from "@/db/query/documents";

export function CreateDocumentButton() {
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();
  const handleCreate = () => {
    startCreateTransition(async () => {
      const id = await createDocumentAction();
      if (id) {
        router.push(`/docs/edit/${id}`);
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
      새 문서
    </Button>
  );
}
