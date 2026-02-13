"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { type LucideIcon, Minus, Plus, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { type WorkflowEdge, type WorkflowNode } from "@/db/schema/workflows";
import {
  type MermaidGraphSize,
  MermaidRenderer,
} from "@/features/canvas/components/cavas-preview/mermaid-renderer";
import {
  DEFAULT_ZOOM,
  type MermaidColorMode,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/features/canvas/constants/canvas-preview";
import { useCanvasPreviewD3 } from "@/features/canvas/hooks/use-canvas-preview-d3";
import {
  buildMermaidCode,
  getAutoFitZoom,
  getNextZoom,
} from "@/features/canvas/utils/canvas-preview";

export function CanvasPreviewClient({
  nodes,
  edges,
}: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}) {
  const { resolvedTheme } = useTheme();
  const colorMode: MermaidColorMode =
    resolvedTheme === "dark" ? "dark" : "light";
  const chart = useMemo(() => buildMermaidCode(nodes, edges), [nodes, edges]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const graphSizeRef = useRef<MermaidGraphSize | null>(null);
  const { zoom, panX, setZoomScale, resetPan } = useCanvasPreviewD3(
    viewportRef,
    {
      defaultZoom: DEFAULT_ZOOM,
      minZoom: ZOOM_MIN,
      maxZoom: ZOOM_MAX,
    },
  );

  const fitToViewport = useCallback(
    (graphSize: MermaidGraphSize) => {
      const viewport = viewportRef.current;
      if (!viewport) return;

      setZoomScale((currentZoom) =>
        getAutoFitZoom({
          currentZoom,
          viewportWidth: viewport.clientWidth,
          viewportHeight: viewport.clientHeight,
          graphWidth: graphSize.width,
          graphHeight: graphSize.height,
        }),
      );
    },
    [setZoomScale],
  );

  const handleReset = useCallback(() => {
    setZoomScale(DEFAULT_ZOOM);
    resetPan();
  }, [resetPan, setZoomScale]);

  const handleGraphRendered = useCallback(
    (graphSize: MermaidGraphSize) => {
      graphSizeRef.current = graphSize;
      fitToViewport(graphSize);
    },
    [fitToViewport],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => {
      if (!graphSizeRef.current) return;
      fitToViewport(graphSizeRef.current);
    });

    observer.observe(viewport);
    return () => observer.disconnect();
  }, [fitToViewport]);

  return (
    <div className="relative h-[200px] overflow-hidden rounded-lg border bg-background/80 dark:bg-background/60">
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border bg-background/90 p-1 shadow-sm backdrop-blur">
        <ZoomIconButton
          label="Zoom out"
          icon={Minus}
          onClick={() =>
            setZoomScale((currentZoom) => getNextZoom(currentZoom, 1))
          }
          disabled={zoom <= ZOOM_MIN}
        />
        <span className="min-w-11 text-center text-xs text-muted-foreground tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <ZoomIconButton
          label="Zoom in"
          icon={Plus}
          onClick={() =>
            setZoomScale((currentZoom) => getNextZoom(currentZoom, -1))
          }
          disabled={zoom >= ZOOM_MAX}
        />
        <ZoomIconButton
          label="Reset zoom"
          icon={RotateCcw}
          onClick={handleReset}
        />
      </div>

      <div
        ref={viewportRef}
        className="scrollbar-slim flex h-full w-full cursor-grab items-center justify-center overflow-hidden overscroll-contain p-3 select-none"
        onDoubleClick={handleReset}
      >
        <div style={{ transform: `translateX(${panX}px)` }}>
          <MermaidRenderer
            chart={chart}
            colorMode={colorMode}
            zoom={zoom}
            onRendered={handleGraphRendered}
          />
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-2 left-2 text-[10px] text-muted-foreground/90">
        휠로 확대/축소 · 드래그로 좌우 이동
      </p>
    </div>
  );
}

function ZoomIconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
