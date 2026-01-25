"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export function MermaidRenderer({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });

    (async () => {
      if (ref.current) {
        ref.current.innerHTML = chart;
        try {
          requestAnimationFrame(async () => {
            if (ref.current) {
              await mermaid.run({ nodes: [ref.current] });
            }
          });
        } catch {
          // no-op
        }
      }
    })();
  }, [chart]);

  return <div ref={ref} className="mermaid" />;
}
