"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export function MermaidRenderer({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });

    if (!ref.current) {
      return;
    }

    ref.current.innerHTML = chart;
    requestAnimationFrame(() => {
      if (!ref.current) {
        return;
      }

      void mermaid.run({ nodes: [ref.current] }).catch((error) => {
        console.error("Mermaid rendering failed:", error);
      });
    });
  }, [chart]);

  return <div ref={ref} className="mermaid" />;
}
