"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// -----------------------------------------------------------------------------
// Constants & Types
// -----------------------------------------------------------------------------

const NODE_COUNT = 24;
const CONNECTION_DISTANCE = 140;
const SIGNAL_COUNT = 8;

interface Point {
  x: number;
  y: number;
  r: number; // radius
}

interface Signal {
  id: number;
  from: number;
  to: number;
  progress: number; // 0 to 1
  speed: number;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

// Random integer between min and max (inclusive)
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random nodes within a container
const generateNodes = (
  width: number,
  height: number,
  count: number,
): Point[] => {
  const nodes: Point[] = [];
  // Create a grid-like distribution with some randomness to ensure coverage but avoid clumping
  const cols = 6;
  const rows = 4;
  const cellW = width / cols;
  const cellH = height / rows;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;

    // Add randomness within the cell
    const x = col * cellW + randomInt(20, cellW - 20);
    const y = row * cellH + randomInt(20, cellH - 20);

    // Add some completely random nodes if we exceed grid count
    if (i >= cols * rows) {
      nodes.push({
        x: randomInt(40, width - 40),
        y: randomInt(40, height - 40),
        r: randomInt(2, 4),
      });
    } else {
      nodes.push({ x, y, r: i % 5 === 0 ? 6 : 3 });
    }
  }
  return nodes;
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function HeroFlowGraph() {
  const [nodes, setNodes] = useState<Point[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);

  // Initialize Nodes
  useEffect(() => {
    // Container size is roughly 800x320 based on previous parent constraints
    setNodes(generateNodes(800, 320, NODE_COUNT));
  }, []);

  // Compute Edges (memoized)
  const edges = useMemo(() => {
    const lines: { from: number; to: number; dist: number }[] = [];
    nodes.forEach((nodeA, i) => {
      nodes.forEach((nodeB, j) => {
        if (i >= j) return; // Avoid duplicates
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Connect if close enough
        if (dist < CONNECTION_DISTANCE) {
          lines.push({ from: i, to: j, dist });
        }
      });
    });
    return lines;
  }, [nodes]);

  // Animation Loop for Signals
  useEffect(() => {
    if (nodes.length === 0 || edges.length === 0) return;

    // Initialize random signals
    const initialSignals: Signal[] = Array.from({ length: SIGNAL_COUNT }).map(
      (_, i) => {
        const edge = edges[randomInt(0, edges.length - 1)];
        return {
          id: i,
          from: edge.from,
          to: edge.to,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.01,
        };
      },
    );
    setSignals(initialSignals);

    let animationFrameId: number;

    const animate = () => {
      setSignals((prevSignals) =>
        prevSignals.map((signal) => {
          let nextProgress = signal.progress + signal.speed;

          if (nextProgress >= 1) {
            // Signal reached destination, respawn at a new random edge
            const nextEdge = edges[randomInt(0, edges.length - 1)];
            // Optionally, try to chain it? (simplified: random jump)
            return {
              ...signal,
              from: nextEdge.from,
              to: nextEdge.to,
              progress: 0,
              speed: 0.005 + Math.random() * 0.015,
            };
          }
          return { ...signal, progress: nextProgress };
        }),
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [nodes, edges]);

  if (nodes.length === 0) return <div className="h-80 w-full" />;

  return (
    <div
      className="relative mx-auto box-border overflow-hidden border-l border-brutal-foreground/20 bg-brutal-background/5" // Subtle background
      style={{
        width: "100%",
        height: "100%",
        minHeight: "320px",
        minWidth: "600px",
      }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {/* Render Edges */}
        {edges.map((edge, i) => {
          const nodeA = nodes[edge.from];
          const nodeB = nodes[edge.to];
          return (
            <line
              key={`edge-${i}`}
              x1={nodeA.x}
              y1={nodeA.y}
              x2={nodeB.x}
              y2={nodeB.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-brutal-foreground/20"
            />
          );
        })}

        {/* Render Signals (Moving dots on edges) */}
        {signals.map((signal) => {
          const nodeA = nodes[signal.from];
          const nodeB = nodes[signal.to];

          if (!nodeA || !nodeB) return null;

          const x = nodeA.x + (nodeB.x - nodeA.x) * signal.progress;
          const y = nodeA.y + (nodeB.y - nodeA.y) * signal.progress;

          return (
            <circle
              key={signal.id}
              cx={x}
              cy={y}
              r={3}
              className="fill-brutal-foreground"
            />
          );
        })}

        {/* Render Nodes */}
        {nodes.map((node, i) => (
          <g key={i} transform={`translate(${node.x}, ${node.y})`}>
            {/* Outer ring for larger nodes */}
            {node.r > 4 && (
              <circle
                r={node.r + 4}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-brutal-foreground/50 opacity-50"
              />
            )}
            <circle
              r={node.r}
              className={cn(
                "fill-brutal-background stroke-2",
                node.r > 4
                  ? "stroke-brutal-foreground"
                  : "stroke-brutal-foreground/50",
              )}
            />
          </g>
        ))}
      </svg>

      {/* Decorative Label - Abstract Tech Feel */}
      <div className="absolute top-4 right-4 text-right">
        <div className="font-mono text-[10px] font-bold text-brutal-foreground/40">
          SYSTEM_OPACITY: 100%
        </div>
        <div className="font-mono text-[10px] font-bold text-brutal-foreground/40">
          NODES_AXT: {NODE_COUNT}
        </div>
      </div>
    </div>
  );
}
