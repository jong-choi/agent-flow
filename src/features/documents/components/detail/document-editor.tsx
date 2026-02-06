"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import rehypeSanitize from "rehype-sanitize";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentStore } from "@/features/documents/store/document-store";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="min-h-[650px] w-full" />,
});

export function DocumentEditor() {
  const value = useDocumentStore((s) => s.documentContent);
  const setValue = useDocumentStore((s) => s.setDocumentContent);
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";
  return (
    <div data-testid="document-editor">
      <MDEditor
        data-color-mode={colorMode}
        value={value}
        onChange={setValue}
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        className="min-h-[650px]"
      />
    </div>
  );
}
