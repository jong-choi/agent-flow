import { type CSSProperties, useId } from "react";
import styles from "./landing-section-backdrop.module.css";

/**
 * 모든 배경 variant에서 공통으로 쓰는 SVG viewBox 크기 옵션입니다.
 */
type BackdropViewportOptions = {
  /** SVG viewBox 가로 크기 */
  viewBoxWidth?: number;
  /** SVG viewBox 세로 크기 */
  viewBoxHeight?: number;
};

/**
 * Hero 영역에서 사용하는 유체형 배경입니다.
 */
type HeroBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "hero";
};

/**
 * Canvas 소개 섹션의 격자 + 연결점 배경입니다.
 */
type CanvasBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "canvas";
  /** 격자 셀 한 칸의 크기(px) */
  gridCellSize?: number;
};

/**
 * Canvas 격자가 움직이는 버전입니다.
 */
type CanvasMovingBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "canvas-moving";
  /** 격자 셀 한 칸의 크기(px) */
  gridCellSize?: number;
};

/**
 * 기본 점 파도 배경입니다.
 */
type DotWavingBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "dot-waving";
  /** 세로 점 개수(행) */
  rows?: number;
  /** 가로 점 개수(열) */
  cols?: number;
  /** 점 반지름(px) */
  dotRadius?: number;
};

/**
 * 고밀도 격자 파도 배경입니다.
 */
type GridWavingBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "grid-waving";
  /** 섹션 톤과 맞추는 색상 프리셋 */
  tone?: "default" | "inverse";
  /** 세로 점 개수(행) */
  rows?: number;
  /** 가로 점 개수(열) */
  cols?: number;
  /** 점 반지름(px) */
  dotRadius?: number;
  /** 깊이 0에서의 가로 간격 기본값 */
  spreadXBase?: number;
  /** 깊이에 따라 가로 간격이 늘어나는 양 */
  spreadXDepthBoost?: number;
  /** 점 배치의 시작 Y 오프셋 */
  yOffset?: number;
  /** 깊이에 따라 Y 방향으로 확장되는 범위 */
  yDepthScale?: number;
  /** 점 파동의 X 이동 기본 진폭(px) */
  waveAmpXBase?: number;
  /** 점 파동의 Y 이동 기본 진폭(px) */
  waveAmpYBase?: number;
};

/**
 * 무한 루프 노드/엣지 배경입니다.
 */
type InfiniteNodesBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "infinite-nodes";
  /** 한 세그먼트(루프 한 칸)의 폭 */
  segmentWidth?: number;
  /** 노드 카드 폭 */
  nodeWidth?: number;
  /** 노드 카드 높이 */
  nodeHeight?: number;
};

/**
 * 채팅 섹션용 파도형 배경입니다.
 */
type ChatBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "chat";
};

/**
 * 워크플로우 섹션용 라인 배경입니다.
 */
type WorkflowsBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "workflows";
};

/**
 * 프리셋 섹션용 폴리곤 배경입니다.
 */
type PresetsBackdropOptions = BackdropViewportOptions & {
  /** 렌더링할 배경 스타일 타입 */
  variant: "presets";
};

/**
 * Landing 배경 컴포넌트 옵션.
 * `options.variant`를 기준으로 나머지 옵션 타입이 자동으로 추론됩니다.
 */
export type LandingSectionBackdropOptions =
  | HeroBackdropOptions
  | CanvasBackdropOptions
  | CanvasMovingBackdropOptions
  | DotWavingBackdropOptions
  | GridWavingBackdropOptions
  | InfiniteNodesBackdropOptions
  | ChatBackdropOptions
  | WorkflowsBackdropOptions
  | PresetsBackdropOptions;

export type LandingSectionBackdropVariant =
  LandingSectionBackdropOptions["variant"];

type LandingSectionBackdropProps = {
  /** 판별 유니온 기반 배경 옵션 */
  options: LandingSectionBackdropOptions;
};

export function LandingSectionBackdrop({
  options,
}: LandingSectionBackdropProps) {
  const { variant } = options;
  const id = useId();
  const canvasGridId = `${id.replace(/:/g, "")}-canvas-grid`;
  const defaultViewBoxWidth = 1200;
  const defaultViewBoxHeight = 700;
  const toViewBox = (width: number, height: number) => `0 0 ${width} ${height}`;

  if (variant === "hero") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.driftSlow} text-indigo-400/30 dark:text-slate-400/14`}
        >
          <path
            d="M-40 380Q220 160 520 340T1240 240V760H-40Z"
            fill="currentColor"
          />
          <path
            d="M-40 460Q180 260 500 430T1240 330V760H-40Z"
            fill="currentColor"
            opacity="0.55"
          />
        </svg>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.spinSlow} text-cyan-500/20 dark:text-zinc-400/10`}
        >
          <circle cx="260" cy="220" r="170" fill="currentColor" />
          <circle cx="860" cy="420" r="220" fill="currentColor" />
        </svg>
      </div>
    );
  }

  if (variant === "canvas") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    const gridCellSize = options.gridCellSize ?? 44;
    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.driftReverse} text-slate-500/20 dark:text-slate-400/12`}
        >
          <defs>
            <pattern
              id={canvasGridId}
              width={gridCellSize}
              height={gridCellSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M${gridCellSize} 0H0V${gridCellSize}`}
                fill="none"
                stroke="currentColor"
              />
            </pattern>
          </defs>
          <rect
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill={`url(#${canvasGridId})`}
          />
        </svg>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.floatSlow} text-blue-400/20 dark:text-zinc-400/9`}
        >
          <circle cx="250" cy="180" r="16" fill="currentColor" />
          <circle cx="460" cy="280" r="16" fill="currentColor" />
          <circle cx="680" cy="240" r="16" fill="currentColor" />
          <circle cx="930" cy="360" r="16" fill="currentColor" />
          <path
            d="M250 180L460 280L680 240L930 360"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={styles.dashFlow}
          />
        </svg>
      </div>
    );
  }

  if (variant === "canvas-moving") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    const gridCellSize = options.gridCellSize ?? 44;
    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.gridMove} text-slate-500/20 dark:text-slate-400/12`}
        >
          <defs>
            <pattern
              id={canvasGridId}
              width={gridCellSize}
              height={gridCellSize}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M${gridCellSize} 0H0V${gridCellSize}`}
                fill="none"
                stroke="currentColor"
              />
            </pattern>
          </defs>
          <rect
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill={`url(#${canvasGridId})`}
          />
        </svg>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.floatSlow} text-blue-400/20 dark:text-zinc-400/9`}
        >
          <circle cx="250" cy="180" r="16" fill="currentColor" />
          <circle cx="460" cy="280" r="16" fill="currentColor" />
          <circle cx="680" cy="240" r="16" fill="currentColor" />
          <circle cx="930" cy="360" r="16" fill="currentColor" />
          <path
            d="M250 180L460 280L680 240L930 360"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={styles.dashFlow}
          />
        </svg>
      </div>
    );
  }

  if (variant === "dot-waving") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    const dotRows = options.rows ?? 10;
    const dotCols = options.cols ?? 17;
    const dotRadius = options.dotRadius ?? 1.6;
    const dots = Array.from({ length: dotRows * dotCols }, (_, index) => {
      const row = Math.floor(index / dotCols);
      const col = index % dotCols;
      const depth = row / (dotRows - 1);
      const x = 88 + col * 64 + (row % 2 === 0 ? 0 : 18);
      const y =
        120 +
        depth * depth * 430 +
        Math.sin(col * 0.72 + row * 0.45) * (6 + depth * 6);
      const r = dotRadius;
      const opacity = 0.18 + depth * 0.55;
      const delay = -(col * 0.12 + row * 0.2);
      const duration = 4.8 + depth * 1.4;
      return { key: `${row}-${col}`, x, y, r, opacity, delay, duration };
    });

    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.dotSurface} text-slate-500/28 dark:text-zinc-300/15`}
        >
          {dots.map((dot) => (
            <circle
              key={dot.key}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill="currentColor"
              opacity={dot.opacity}
              className={styles.dotWave}
              style={{
                animationDelay: `${dot.delay}s`,
                animationDuration: `${dot.duration}s`,
              }}
            />
          ))}
        </svg>
      </div>
    );
  }

  if (variant === "grid-waving") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    const toneClass =
      options.tone === "inverse" ? "text-brutal-background" : "text-foreground";
    const gridRows = options.rows ?? 15;
    const gridCols = options.cols ?? 30;
    const dotRadius = options.dotRadius ?? 0.5;
    const centerX = viewBoxWidth / 2;
    const midCol = (gridCols - 1) / 2;

    const dots = Array.from({ length: gridRows * gridCols }, (_, index) => {
      const row = Math.floor(index / gridCols);
      const col = index % gridCols;
      const depth = row / (gridRows - 1);
      const depthCurve = depth ** 1.55;
      const phase = col * 0.34 - row * 0.56;
      const spreadX =
        (options.spreadXBase ?? 30) + depth * (options.spreadXDepthBoost ?? 17);
      const x =
        centerX +
        (col - midCol) * spreadX +
        Math.sin(row * 0.62 + col * 0.18) * (0.5 + depth * 0.8);
      const y =
        (options.yOffset ?? 88) +
        depthCurve * (options.yDepthScale ?? 470) +
        Math.sin((col - midCol) * 0.26) * (1.2 + depth * 2.6);
      const tone = 0.75 + depth * 0.2;
      const ampX = (options.waveAmpXBase ?? 0.8) + depth * 1.7;
      const ampY = (options.waveAmpYBase ?? 2.6) + depth * 7.4;
      const delay = -(phase * 0.46);
      const duration = 6.2 + (1 - depth) * 1.6;
      const style: CSSProperties = {
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        ["--gw-x" as string]: `${ampX}px`,
        ["--gw-y" as string]: `${ampY}px`,
      };
      return { key: `${row}-${col}`, x, y, tone, style };
    });

    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.gridWaveSurface} ${toneClass}`}
        >
          <g className={styles.gridWaveWeave}>
            {dots.map((dot) => (
              <circle
                key={dot.key}
                cx={dot.x}
                cy={dot.y}
                r={dotRadius}
                fill="currentColor"
                fillOpacity={dot.tone}
                className={styles.gridWaveDot}
                style={dot.style}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  }

  if (variant === "infinite-nodes") {
    const segmentWidth = options.segmentWidth ?? 1760;
    const viewBoxWidth = options.viewBoxWidth ?? segmentWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    const nodeWidth = options.nodeWidth ?? 224;
    const nodeHeight = options.nodeHeight ?? 108;
    const baseNodes = [
      { id: "trigger", x: 84, y: 298, accent: "#8b95a7" },
      { id: "search", x: 430, y: 76, accent: "#7f9ea6" },
      { id: "parallel-a", x: 822, y: 44, accent: "#9a88a8" },
      { id: "parallel-b", x: 822, y: 356, accent: "#7f92a3" },
      { id: "action", x: 1238, y: 176, accent: "#a68f72" },
      { id: "output", x: 1492, y: 304, accent: "#8e9f86" },
    ];
    const copies = [0, segmentWidth];

    const nodes = copies.flatMap((offset, copyIndex) =>
      baseNodes.map((node, nodeIndex) => ({
        ...node,
        key: `${copyIndex}-${node.id}`,
        x: node.x + offset,
        delay: -(nodeIndex * 0.3 + copyIndex * 0.95),
      })),
    );
    const nodeMap = new Map(nodes.map((node) => [node.key, node]));
    const linkSpecs = copies.flatMap((_, copyIndex) => {
      const links: Array<{
        from: string;
        to: string;
        tone: "primary" | "secondary";
      }> = [
        {
          from: `${copyIndex}-trigger`,
          to: `${copyIndex}-search`,
          tone: "primary",
        },
        {
          from: `${copyIndex}-search`,
          to: `${copyIndex}-parallel-a`,
          tone: "primary",
        },
        {
          from: `${copyIndex}-search`,
          to: `${copyIndex}-parallel-b`,
          tone: "secondary",
        },
        {
          from: `${copyIndex}-parallel-a`,
          to: `${copyIndex}-action`,
          tone: "primary",
        },
        {
          from: `${copyIndex}-parallel-b`,
          to: `${copyIndex}-action`,
          tone: "secondary",
        },
        {
          from: `${copyIndex}-action`,
          to: `${copyIndex}-output`,
          tone: "primary",
        },
      ];

      if (copyIndex < copies.length - 1) {
        links.push({
          from: `${copyIndex}-output`,
          to: `${copyIndex + 1}-trigger`,
          tone: "secondary",
        });
      }

      return links;
    });

    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.trackLayer} text-slate-500/22 dark:text-zinc-300/14`}
        >
          <g className={styles.infiniteNodesTrack}>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to={`-${segmentWidth} 0`}
              dur="20s"
              repeatCount="indefinite"
            />

            <g className={styles.nodeLinks}>
              {linkSpecs.map((link) => {
                const fromNode = nodeMap.get(link.from);
                const toNode = nodeMap.get(link.to);
                if (!fromNode || !toNode) {
                  return null;
                }

                const sx = fromNode.x + nodeWidth + 8;
                const sy = fromNode.y + nodeHeight * 0.52;
                const tx = toNode.x - 8;
                const ty = toNode.y + nodeHeight * 0.52;
                const curve = Math.max(92, Math.abs(tx - sx) * 0.32);

                return (
                  <path
                    key={`edge-${link.from}-${link.to}`}
                    d={`M ${sx} ${sy} C ${sx + curve} ${sy}, ${tx - curve} ${ty}, ${tx} ${ty}`}
                    className={
                      link.tone === "secondary"
                        ? styles.nodeEdgeSecondary
                        : styles.nodeEdge
                    }
                  />
                );
              })}
            </g>

            {nodes.map((node) => (
              <g
                key={node.key}
                className={styles.nodeCard}
                style={{ animationDelay: `${node.delay}s` }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="16"
                  fill="currentColor"
                  className={styles.nodeCardFill}
                />

                <rect
                  x={node.x + 14}
                  y={node.y + 14}
                  width="26"
                  height="26"
                  rx="8"
                  fill={node.accent}
                  className={styles.nodeIcon}
                />

                <rect
                  x={node.x + 50}
                  y={node.y + 18}
                  width="92"
                  height="9"
                  rx="4.5"
                  fill="currentColor"
                  className={styles.nodeTitle}
                />
                <rect
                  x={node.x + 50}
                  y={node.y + 34}
                  width="122"
                  height="7"
                  rx="3.5"
                  fill="currentColor"
                  className={styles.nodeMeta}
                />
                <rect
                  x={node.x + 14}
                  y={node.y + 61}
                  width={nodeWidth - 28}
                  height="8"
                  rx="4"
                  fill="currentColor"
                  className={styles.nodeLine}
                />
                <rect
                  x={node.x + 14}
                  y={node.y + 76}
                  width={nodeWidth - 58}
                  height="8"
                  rx="4"
                  fill="currentColor"
                  className={styles.nodeLine}
                />

                <circle
                  cx={node.x - 4}
                  cy={node.y + nodeHeight * 0.52}
                  r="4.2"
                  fill="currentColor"
                  className={styles.nodeHandle}
                />
                <circle
                  cx={node.x + nodeWidth + 4}
                  cy={node.y + nodeHeight * 0.52}
                  r="4.2"
                  fill="currentColor"
                  className={styles.nodeHandle}
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    );
  }

  if (variant === "chat") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.waveSlide} text-fuchsia-400/25 dark:text-slate-400/10`}
        >
          <path
            d="M0 370Q140 280 280 370T560 370T840 370T1120 370T1400 370V700H0Z"
            fill="currentColor"
          />
          <path
            d="M0 430Q140 340 280 430T560 430T840 430T1120 430T1400 430V700H0Z"
            fill="currentColor"
            opacity="0.55"
          />
        </svg>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.pulseSoft} text-sky-500/20 dark:text-zinc-400/8`}
        >
          <circle cx="880" cy="200" r="160" fill="currentColor" />
          <circle cx="360" cy="480" r="180" fill="currentColor" />
        </svg>
      </div>
    );
  }

  if (variant === "workflows") {
    const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
    const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
    return (
      <div className={styles.sectionBackdrop} aria-hidden>
        <svg
          viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
          className={`${styles.layer} ${styles.driftSlow} text-emerald-400/20 dark:text-slate-400/10`}
        >
          <path
            d="M120 520L340 250L560 440L780 180L1000 360"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className={styles.dashFlow}
          />
          <circle cx="120" cy="520" r="18" fill="currentColor" />
          <circle cx="340" cy="250" r="18" fill="currentColor" />
          <circle cx="560" cy="440" r="18" fill="currentColor" />
          <circle cx="780" cy="180" r="18" fill="currentColor" />
          <circle cx="1000" cy="360" r="18" fill="currentColor" />
        </svg>
      </div>
    );
  }

  const viewBoxWidth = options.viewBoxWidth ?? defaultViewBoxWidth;
  const viewBoxHeight = options.viewBoxHeight ?? defaultViewBoxHeight;
  return (
    <div className={styles.sectionBackdrop} aria-hidden>
      <svg
        viewBox={toViewBox(viewBoxWidth, viewBoxHeight)}
        className={`${styles.layer} ${styles.spinSlow} text-amber-400/20 dark:text-zinc-400/9`}
      >
        <path
          d="M600 110L760 180L820 340L760 500L600 570L440 500L380 340L440 180Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
        />
        <path
          d="M600 190L700 235L738 340L700 445L600 490L500 445L462 340L500 235Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
