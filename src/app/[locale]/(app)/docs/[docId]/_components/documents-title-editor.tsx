"use client";

import { useDocumentStore } from "@/app/[locale]/(app)/docs/[docId]/_store/document-store";
import { Input } from "@/components/ui/input";

export function DocumentTitleEditor() {
  const value = useDocumentStore((s) => s.documentTitle);
  const setValue = useDocumentStore((s) => s.setDocumentTitle);

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value.slice(0, 20))}
      className="!min-w-[500px] !text-xl"
      data-testid="document-title-input"
    />
  );
}
