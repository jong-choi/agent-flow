"use client";

import dynamic from "next/dynamic";
import rehypeSanitize from "rehype-sanitize";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { useDocumentStore } from "@/app/[locale]/(app)/docs/[docId]/_store/document-store";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function DocumentEditor() {
  const value = useDocumentStore((s) => s.documentContent);
  const setValue = useDocumentStore((s) => s.setDocumentContent);

  return (
    <MDEditor
      value={value}
      onChange={setValue}
      previewOptions={{
        rehypePlugins: [[rehypeSanitize]],
      }}
      className="min-h-[650px]"
    />
  );
}
