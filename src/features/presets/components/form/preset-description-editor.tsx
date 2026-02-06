"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import rehypeSanitize from "rehype-sanitize";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
import { Skeleton } from "@/components/ui/skeleton";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <Skeleton className="min-h-[600px] w-full" />,
});

type PresetDescriptionEditorProps = {
  id?: string;
  name?: string;
  defaultValue?: string | null;
  placeholder?: string;
};

export function PresetDescriptionEditor({
  id = "description",
  name = "description",
  defaultValue = "",
  placeholder,
}: PresetDescriptionEditorProps) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const { resolvedTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <MDEditor
      data-color-mode={colorMode}
      value={value}
      onChange={(nextValue) => setValue(nextValue ?? "")}
      previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
      textareaProps={{ id, name, placeholder }}
      className="min-h-[600px]"
    />
  );
}
