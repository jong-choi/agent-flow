import { ReactMarkdownApp } from "@/features/chat/components/markdown/react-markdown-app";
import "@/features/chat/styles/small-header-markdown.css";
import { cn } from "@/lib/utils";

interface MarkdownWrapperProps {
  className?: string;
  children?: string;
}

export function MarkdownWrapper({ children, className }: MarkdownWrapperProps) {
  return (
    <div className={cn("new-york-small p-[12px] break-all", className || "")}>
      <ReactMarkdownApp>{children}</ReactMarkdownApp>
    </div>
  );
}
