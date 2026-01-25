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
        requestAnimationFrame(async () => {
          if (ref.current) {
            try {
              await mermaid.run({ nodes: [ref.current] });
            } catch (e) {
              console.error("Mermaid rendering failed:", e);
            }
          }
        });
      }
    })();
  }, [chart]);

  return <div ref={ref} className="mermaid" />;
}
