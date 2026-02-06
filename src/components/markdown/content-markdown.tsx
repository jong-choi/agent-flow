import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import "@/features/chat/styles/highlight-vs-code-dark.css";
import { cn } from "@/lib/utils";

type ContentMarkdownProps = {
  className?: string;
  children?: string;
};

export function ContentMarkdown({ className, children }: ContentMarkdownProps) {
  return (
    <article
      className={cn(
        "docs-markdown text-[15px] leading-7 break-words text-foreground",
        "selection:bg-primary/20 selection:text-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkParse, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ className, ...props }) => (
            <h1
              className={cn(
                "scroll-m-20 text-3xl leading-tight font-bold tracking-tight",
                "mt-2 mb-6",
                className,
              )}
              {...props}
            />
          ),
          h2: ({ className, ...props }) => (
            <h2
              className={cn(
                "scroll-m-20 border-b border-border/60 pb-2 text-2xl leading-tight font-semibold tracking-tight",
                "mt-10 mb-4",
                className,
              )}
              {...props}
            />
          ),
          h3: ({ className, ...props }) => (
            <h3
              className={cn(
                "scroll-m-20 text-xl leading-snug font-semibold tracking-tight",
                "mt-8 mb-3",
                className,
              )}
              {...props}
            />
          ),
          h4: ({ className, ...props }) => (
            <h4
              className={cn(
                "scroll-m-20 text-base leading-snug font-semibold tracking-tight",
                "mt-6 mb-2",
                className,
              )}
              {...props}
            />
          ),
          p: ({ className, ...props }) => (
            <p
              className={cn(
                "text-foreground/90",
                "mt-4 [&:first-child]:mt-0",
                className,
              )}
              {...props}
            />
          ),
          a: ({ className, href, ...props }) => {
            const isExternal =
              typeof href === "string" && /^https?:\/\//.test(href);

            return (
              <a
                className={cn(
                  "font-medium text-primary underline underline-offset-4",
                  "decoration-primary/35 hover:decoration-primary/70",
                  className,
                )}
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                {...props}
              />
            );
          },
          ul: ({ className, ...props }) => (
            <ul
              className={cn("mt-4 ml-6 list-disc space-y-2", className)}
              {...props}
            />
          ),
          ol: ({ className, ...props }) => (
            <ol
              className={cn("mt-4 ml-6 list-decimal space-y-2", className)}
              {...props}
            />
          ),
          li: ({ className, ...props }) => (
            <li className={cn("text-foreground/90", className)} {...props} />
          ),
          blockquote: ({ className, ...props }) => (
            <blockquote
              className={cn(
                "mt-6 rounded-md border-l-2 border-border bg-muted/40 px-4 py-3 text-muted-foreground",
                className,
              )}
              {...props}
            />
          ),
          hr: ({ className, ...props }) => (
            <hr
              className={cn("my-10 border-border/70", className)}
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const codeClassName =
              typeof className === "string" ? className : "";
            const isBlock =
              codeClassName.includes("hljs") ||
              codeClassName.includes("language-");

            if (!isBlock) {
              return (
                <code
                  className={cn(
                    "rounded-md border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[0.9em] leading-none text-foreground",
                    codeClassName,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={cn("font-mono text-sm", codeClassName)}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                "scrollbar-slim mt-4 overflow-x-auto rounded-lg border border-border/60 bg-[#1e1e1e] p-4 text-sm leading-relaxed shadow-sm",
                className,
              )}
              {...props}
            />
          ),
          table: ({ className, ...props }) => (
            <div className="scrollbar-slim mt-6 overflow-x-auto rounded-lg border border-border/60">
              <table
                className={cn("w-full border-collapse text-sm", className)}
                {...props}
              />
            </div>
          ),
          thead: ({ className, ...props }) => (
            <thead className={cn("bg-muted/60", className)} {...props} />
          ),
          th: ({ className, ...props }) => (
            <th
              className={cn(
                "border-b border-border/60 px-3 py-2 text-left font-semibold",
                className,
              )}
              {...props}
            />
          ),
          td: ({ className, ...props }) => (
            <td
              className={cn(
                "border-b border-border/60 px-3 py-2 align-top",
                className,
              )}
              {...props}
            />
          ),
          img: ({ className, alt = "", ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={cn(
                "mt-6 max-h-[460px] w-auto rounded-lg border border-border/60 shadow-sm",
                className,
              )}
              alt={alt}
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}
