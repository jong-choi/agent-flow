"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updateDocumentAction } from "@/features/documents/server/actions";
import { useDocumentStore } from "@/features/documents/store/document-store";

export function DocumentSaveButton({ docId }: { docId: string }) {
  const title = useDocumentStore((s) => s.documentTitle);
  const content = useDocumentStore((s) => s.documentContent);
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      await updateDocumentAction({
        docId,
        title,
        content,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={!title || loading}
      variant="outline"
    >
      {loading ? <Spinner className="size-4" /> : <Save className="size-4" />}
      저장하기
    </Button>
  );
}
