"use client";

import { Input } from "@/components/ui/input";
import { useDocumentStore } from "@/features/documents/store/document-store";

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
