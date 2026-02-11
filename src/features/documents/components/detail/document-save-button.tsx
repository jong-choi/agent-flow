"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updateDocumentAction } from "@/features/documents/server/actions";
import { useDocumentStore } from "@/features/documents/store/document-store";
import { type AppMessageKeys } from "@/lib/i18n/messages";

export function DocumentSaveButton({ docId }: { docId: string }) {
  const t = useTranslations<AppMessageKeys>("Docs");
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
      {t("detailPage.save")}
    </Button>
  );
}
