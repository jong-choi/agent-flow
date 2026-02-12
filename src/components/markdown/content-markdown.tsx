import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import "@/features/chats/styles/highlight-vs-code-dark.css";
import { cn } from "@/lib/utils";

type ContentMarkdownProps = {
  className?: string;
  children?: string;
};

export function ContentMarkdown({ className, children }: ContentMarkdownProps) {
  return (
    <article className={cn("prose dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, ...props }) => {
            // 링크 새창으로 열기
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}
