"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

export function MermaidRenderer({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false });

    if (ref.current) {
      ref.current.innerHTML = chart;
      mermaid.run({
        querySelector: ".mermaid",
      });
    }
  }, [chart]);

  return <div className="mermaid" ref={ref} />;
}
