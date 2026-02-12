"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { type MermaidColorMode } from "@/features/canvas/constants/canvas-preview";

export type MermaidGraphSize = {
  width: number;
  height: number;
};

type MermaidRendererProps = {
  chart: string;
  colorMode: MermaidColorMode;
  zoom: number;
  onRendered?: (size: MermaidGraphSize) => void;
};

export function MermaidRenderer({
  chart,
  colorMode,
  zoom,
  onRendered,
}: MermaidRendererProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isDark = colorMode === "dark";
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      flowchart: {
        htmlLabels: true,
      },
      themeVariables: {
        darkMode: isDark,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        background: isDark ? "#020617" : "#f8fafc",
        mainBkg: isDark ? "#111827" : "#f8fafc",
        secondBkg: isDark ? "#1f2937" : "#e2e8f0",
        tertiaryBkg: isDark ? "#334155" : "#e2e8f0",
        primaryColor: isDark ? "#1f2937" : "#f1f5f9",
        primaryTextColor: isDark ? "#f8fafc" : "#0f172a",
        primaryBorderColor: isDark ? "#64748b" : "#64748b",
        lineColor: isDark ? "#94a3b8" : "#64748b",
        textColor: isDark ? "#f8fafc" : "#0f172a",
      },
    });

    const container = ref.current;
    if (!container) {
      return;
    }

    container.removeAttribute("data-processed");
    container.innerHTML = chart;

    let cancelled = false;
    requestAnimationFrame(() => {
      if (!container || cancelled) {
        return;
      }

      void mermaid
        .run({ nodes: [container] })
        .then(() => {
          if (cancelled) {
            return;
          }

          const graphSize = resolveGraphSize(container);
          if (graphSize) {
            onRendered?.(graphSize);
          }
        })
        .catch((error) => {
          console.error("Mermaid rendering failed:", error);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [chart, colorMode, onRendered]);

  return (
    <div
      className="inline-block min-w-max"
      style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
    >
      <div ref={ref} className="mermaid" />
    </div>
  );
}

const resolveGraphSize = (
  container: HTMLDivElement,
): MermaidGraphSize | null => {
  const svg = container.querySelector("svg");
  if (!svg) {
    return null;
  }

  const rect = svg.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return { width: rect.width, height: rect.height };
  }

  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  try {
    const bbox = svg.getBBox();
    if (bbox.width > 0 && bbox.height > 0) {
      return { width: bbox.width, height: bbox.height };
    }
  } catch {
    return null;
  }

  return null;
};
