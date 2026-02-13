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
          img: () => null, // 마크다운 이미지 삽입 불가
          a: ({ href, children, ...props }) => {
            const safe = safeHref(href);
            if (!safe) return <span {...props}>{children}</span>;
            return (
              <a
                href={safe}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}

const safeHref = (href?: string): string | undefined => {
  if (!href) return undefined;

  const trimmed = href.trim();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith(".") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("//")
  ) {
    return undefined;
  }

  try {
    const u = new URL(trimmed);
    const protocol = u.protocol.toLowerCase();

    if (protocol === "http:" || protocol === "https:") {
      return u.toString();
    }

    return undefined;
  } catch {
    return undefined;
  }
};
