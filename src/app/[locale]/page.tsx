import Link from "next/link";
import { HeroFlowGraph } from "@/components/main/hero-flow-graph";
import { BrutalBadge } from "@/components/main/ui/brutal-badge";
import { BrutalButton } from "@/components/main/ui/brutal-button";
import { BrutalCard } from "@/components/main/ui/brutal-card";
import { BrutalHeading } from "@/components/main/ui/brutal-heading";
import { BrutalHeadingAccent } from "@/components/main/ui/brutal-heading-accent";
import { BrutalSection } from "@/components/main/ui/brutal-section";
import { BrutalTag } from "@/components/main/ui/brutal-tag";
import {
  BrutalExpandLine,
  BrutalGrid,
  BrutalRadialGlow,
} from "@/components/main/ui/brutal-utils";

/**
 * AgentFlow Brutal Landing Page
 * Reinterpretation of Amber page using brutal tokens.
 */
export default function BrutalLandingPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-brutal-background font-sans text-brutal-foreground transition-colors duration-300">
      {/* 히어로 섹션 */}
      <BrutalSection container="hero" id="hero">
        <div className="mb-12 border-l-[32px] border-brutal-foreground bg-brutal-muted/30 p-12">
          <div className="grid gap-10 sm:grid-cols-1 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="col-span-1">
              <BrutalHeading variant="label" as="p" className="mb-2">
                Let
              </BrutalHeading>
              <BrutalHeading variant="label" as="p" className="mb-2">
                your
              </BrutalHeading>
              <BrutalHeading variant="hero" as="h1">
                AGENT
                <br />
                <span className="mt-4 inline-block bg-brutal-foreground px-4 pr-6 text-brutal-background">
                  FLOW
                </span>
              </BrutalHeading>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-12">
          <BrutalButton size="lg" asChild>
            <Link href="/workflows/canvas">시작하기</Link>
          </BrutalButton>
          <p className="max-w-sm text-2xl leading-[1.1] font-black uppercase">
            플로우차트 에이전트
            <br />
            <span className="text-brutal-muted-foreground">
              나만의 인공지능 에이전트 만들기
            </span>
          </p>
        </div>
      </BrutalSection>

      <BrutalSection
        variant="inverse"
        className="overflow-hidden border-t-2 border-brutal-border"
        id="canvas"
      >
        <BrutalRadialGlow className="opacity-80" />
        <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <div>
            <BrutalBadge variant="inverse" className="mb-4">
              #CANVAS_EDITOR
            </BrutalBadge>
            <br />
            <BrutalHeading variant="h2">
              WORKFLOW
              <br />
              <BrutalHeadingAccent variant="inverse">
                EDITOR
              </BrutalHeadingAccent>
            </BrutalHeading>
            <p className="mb-8 max-w-md leading-relaxed font-bold uppercase opacity-70">
              드래그 앤 드롭으로 노드를 배치하고, 엣지로 연결하세요. <br />
              채팅, 검색, 문서를 다양하게 연결할 수 있습니다.
            </p>
            <BrutalButton
              variant="outline"
              className="border-brutal-background text-brutal-background hover:bg-brutal-background hover:text-brutal-foreground"
              asChild
            >
              <Link href="/workflows/canvas">캔버스로 이동하기 →</Link>
            </BrutalButton>
          </div>

          <BrutalCard
            variant="outline"
            padding="default"
            className="border-brutal-background/40 bg-transparent text-brutal-background"
          >
            <div className="grid grid-cols-3 gap-4">
              {[
                "Trigger",
                "LLM Call",
                "Search",
                "Condition",
                "Output",
                "Tool",
              ].map((node, i) => (
                <div
                  key={node}
                  className={`border-2 p-4 text-center text-xs font-black uppercase italic ${
                    i === 1 || i === 4
                      ? "border-brutal-background bg-brutal-background text-brutal-foreground"
                      : "border-brutal-background/40 bg-transparent text-brutal-background/80"
                  }`}
                >
                  {node}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="h-[3px] flex-1 bg-brutal-background/50" />
              <div className="h-3 w-3 rotate-45 bg-brutal-background" />
            </div>
          </BrutalCard>
        </div>
      </BrutalSection>
      <BrutalSection
        className="border-t-2 border-brutal-border"
        id="how-it-works"
      >
        <BrutalGrid>
          {[
            {
              step: "01",
              title: "Design",
              desc: "캔버스에서 노드와 엣지로 에이전트 로직을 설계합니다.",
              variant: "default" as const,
            },
            {
              step: "02",
              title: "Configure",
              desc: "각 노드의 프롬프트, 도구, 모델을 세부 설정합니다.",
              variant: "filled" as const,
            },
            {
              step: "03",
              title: "Test",
              desc: "채팅 인터페이스에서 워크플로우를 즉시 테스트합니다.",
              variant: "default" as const,
            },
            {
              step: "04",
              title: "Deploy",
              desc: "API 키를 발급하고 외부 서비스에 에이전트를 배포합니다.",
              variant: "inverse" as const,
            },
          ].map((s) => {
            const v =
              s.variant === "filled"
                ? "md:mt-8"
                : s.variant === "inverse"
                  ? "md:mt-8"
                  : "";
            return (
              <BrutalCard
                key={s.step}
                variant={s.variant}
                padding="default"
                className={`group flex h-64 flex-col justify-between ${v}`}
              >
                <div className="text-4xl font-black italic opacity-30">
                  {s.step}.
                </div>
                <div>
                  <BrutalExpandLine className="mb-3" />
                  <BrutalHeading variant="h4">{s.title}</BrutalHeading>
                  <p className="text-sm leading-relaxed font-bold uppercase opacity-50">
                    {s.desc}
                  </p>
                </div>
              </BrutalCard>
            );
          })}
        </BrutalGrid>
      </BrutalSection>

      {/* ═══════════════════════════════════════════
          SECTION 5 — AI Chat
          ═══════════════════════════════════════════ */}
      <BrutalSection
        variant="inverse"
        className="overflow-hidden border-t-2 border-brutal-border"
        id="chat"
      >
        <BrutalRadialGlow className="opacity-80" />
        <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <div className="space-y-4">
            <BrutalCard
              variant="default"
              padding="sm"
              className="ml-8 max-w-md p-5 font-bold text-brutal-foreground uppercase"
            >
              <span className="mb-2 block text-sm tracking-widest text-brutal-muted-foreground uppercase">
                사용자
              </span>
              요즘 유행어에 대해 검색하고 문서에 저장해줘
            </BrutalCard>
            <BrutalCard
              variant="inverse"
              className="mr-8 max-w-md p-5 font-bold uppercase"
            >
              <span className="mb-2 block text-sm tracking-widest opacity-60">
                에이전트
              </span>
              검색 결과를 바탕으로 작성해드리겠습니다
            </BrutalCard>
            <BrutalCard
              variant="default"
              className="ml-4 max-w-md p-5 font-bold text-brutal-foreground uppercase"
            >
              <span className="mb-2 block text-sm tracking-widest text-brutal-muted-foreground uppercase">
                사용자
              </span>
              SEO에 최적화된 방식으로 블로그 게시물을 추가해줘
            </BrutalCard>
          </div>

          <div>
            <BrutalBadge variant="inverse" className="mb-4">
              #MULTI_MODEL_CHAT
            </BrutalBadge>
            <BrutalHeading variant="h2">
              AGENT
              <br />
              <BrutalHeadingAccent variant="inverse">CHAT</BrutalHeadingAccent>
            </BrutalHeading>
            <p className="mb-6 max-w-md leading-relaxed font-bold uppercase opacity-70">
              설계한 워크플로우를 즉시 채팅 인터페이스로 실행하세요. <br />
              메모리와 컨텍스트를 유지하며 멀티턴 대화를 지원합니다.
            </p>
            <div className="flex gap-4">
              <BrutalTag variant="outline">Memory</BrutalTag>
              <BrutalTag variant="outline">Search</BrutalTag>
              <BrutalTag variant="outline">Tool_Call</BrutalTag>
            </div>
          </div>
        </div>
      </BrutalSection>

      {/* ═══════════════════════════════════════════
          SECTION 6 — Preset Marketplace
          ═══════════════════════════════════════════ */}
      <BrutalSection className="border-t-2 border-brutal-border" id="presets">
        <div className="grid items-start gap-16 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <BrutalBadge className="mb-4">#MARKETPLACE</BrutalBadge>
            <BrutalHeading variant="h2">
              PRESET
              <br />
              <BrutalHeadingAccent>MARKET</BrutalHeadingAccent>
            </BrutalHeading>
            <p className="mb-8 max-w-md leading-relaxed font-bold uppercase opacity-50">
              커뮤니티가 만든 에이전트 프리셋을 탐색하고, <br />
              크레딧으로 구매하여 바로 사용하세요.
            </p>
            <BrutalButton variant="outline" asChild>
              <Link href="/presets">프리셋 보러가기 →</Link>
            </BrutalButton>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                name: "고객 상담용 챗봇",
                tag: "고객지원",
                price: 1,
              },
              {
                name: "SEO 키워드 맞춤 블로그 게시물",
                tag: "마케팅",
                price: 5,
              },
              { name: "프로젝트 관리 챗봇", tag: "운영", price: 0 },
              { name: "병렬 코드 작성", tag: "개발", price: 3 },
            ].map((preset) => (
              <BrutalCard
                key={preset.name}
                variant="default"
                padding="default"
                className="group mt-6 p-6"
              >
                <div className="mb-6 flex items-start justify-between">
                  <span className="text-sm font-black tracking-widest text-brutal-muted-foreground uppercase">
                    {preset.tag}
                  </span>
                  <span className="text-lg font-black text-brutal-foreground">
                    {preset.price ? `${preset.price} 크레딧` : "무료"}
                  </span>
                </div>
                <h5 className="text-md leading-tight font-black uppercase">
                  {preset.name}
                </h5>
                <div className="mt-4 w-full border-t border-brutal-foreground" />
              </BrutalCard>
            ))}
          </div>
        </div>
      </BrutalSection>

      {/* ═══════════════════════════════════════════
          SECTION 9 — Credits & Attendance
          ═══════════════════════════════════════════ */}
      <BrutalSection
        variant="inverse"
        className="overflow-hidden border-t-2 border-brutal-border"
        id="credits"
      >
        <BrutalRadialGlow className="opacity-80" />
        <div className="relative z-10 grid items-center gap-16 lg:grid-cols-2">
          <div>
            <BrutalBadge variant="inverse" className="mb-4">
              #CREDIT_SYSTEM
            </BrutalBadge>
            <BrutalHeading variant="h2">
              FREE
              <br />
              <BrutalHeadingAccent variant="inverse">
                CREDITS
              </BrutalHeadingAccent>
            </BrutalHeading>
            <p className="max-w-md leading-relaxed font-bold uppercase opacity-70">
              매일 출석 체크로 무료 크레딧을 획득하세요. <br />
              연속 출석 보너스로 더 많은 크레딧을 받을 수 있습니다.
            </p>
            <BrutalButton
              variant="outline"
              className="mt-8 border-brutal-background text-brutal-background hover:bg-brutal-background hover:text-brutal-foreground"
              asChild
            >
              <Link href="http://localhost:3000/credits/attendance">
                출석체크하기 →
              </Link>
            </BrutalButton>
          </div>

          <BrutalCard
            variant="filled"
            padding="default"
            className="border-brutal-primary/40 bg-brutal-muted/80"
          >
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="mb-1 text-sm font-black tracking-wide text-brutal-muted-foreground uppercase italic">
                  Current Balance
                </div>
                <div className="text-4xl leading-none font-black text-brutal-primary italic">
                  1,240C
                </div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-sm font-black tracking-wide text-brutal-muted-foreground uppercase italic">
                  Streak
                </div>
                <div className="text-2xl font-black text-brutal-foreground italic">
                  7 DAYS
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div
                  key={`${day}-${i}`}
                  className={`border-2 py-3 text-center text-xs font-black uppercase italic ${
                    i < 5
                      ? i % 2 === 0
                        ? "border-brutal-primary bg-brutal-primary text-brutal-primary-foreground"
                        : "border-brutal-foreground bg-brutal-foreground text-brutal-background"
                      : "border-brutal-border bg-transparent text-brutal-muted-foreground"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="h-[2px] bg-brutal-muted-foreground/40" />
              <div className="h-2 w-2 rotate-45 bg-brutal-primary" />
              <div className="h-[2px] bg-brutal-foreground/40" />
            </div>
          </BrutalCard>
        </div>
      </BrutalSection>

      {/* ═══════════════════════════════════════════
          SECTION 11 — Developer API
          ═══════════════════════════════════════════ */}
      <BrutalSection
        className="border-t-2 border-brutal-border"
        id="developer-api"
      >
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div>
            <BrutalBadge className="mb-4">#DEVELOPER_API</BrutalBadge>
            <BrutalHeading variant="h2">
              REST
              <br />
              <BrutalHeadingAccent>API</BrutalHeadingAccent>
            </BrutalHeading>
            <p className="mb-8 max-w-md leading-relaxed font-bold uppercase opacity-50">
              OpenAI 호환 엔드포인트를 통해 기존 SDK 코드를 그대로 연결하고,
              <br />
              에이전트 워크플로우를 즉시 호출할 수 있습니다.
            </p>
            <BrutalButton variant="outline" asChild>
              <Link href="/developers">API 문서 보기 →</Link>
            </BrutalButton>
          </div>

          <BrutalCard
            variant="muted"
            padding="default"
            className="p-6 font-mono text-xs leading-relaxed"
          >
            <div className="mb-4 text-sm font-black tracking-widest text-brutal-muted-foreground uppercase italic">
              API_CALL_EXAMPLE
            </div>
            <pre className="overflow-x-auto opacity-70">
              {`import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: "https://agentflow.jongchoi.com/api/v1/openai",
});

const result = await client.chat.completions.create({
  model: "af-id-*******************",
  messages: [{ role: "user", content: "강아지 키우는 법을 알려줘" }],
});

console.log(result.choices[0].message.content);`}
            </pre>
          </BrutalCard>
        </div>
      </BrutalSection>

      {/* ═══════════════════════════════════════════
          SECTION 13 — Footer CTA
          ═══════════════════════════════════════════ */}
      <BrutalSection variant="inverse" className="overflow-hidden py-32">
        <BrutalRadialGlow />

        {/* Marquee */}
        <div className="relative z-10 mb-20 overflow-hidden border-y border-brutal-background/20 py-4">
          <div className="animate-ticker flex whitespace-nowrap">
            {Array(2)
              .fill([
                "XYFLOW",
                "NEXT.JS",
                "REACT",
                "TAILWIND",
                "DRIZZLE",
                "OPENAI",
                "CLAUDE",
                "GEMINI",
                "POSTGRES",
                "VERCEL",
              ])
              .flat()
              .map((tech, i) => (
                <span
                  key={`${tech}-${i}`}
                  className="mx-8 text-sm font-black tracking-widest uppercase italic opacity-30 transition-opacity hover:text-brutal-background hover:opacity-100"
                >
                  {tech}
                </span>
              ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-12 text-center">
          <BrutalHeading variant="h2" className="mb-8 md:text-8xl">
            START
            <br />
            <span className="mt-4 inline-block bg-brutal-muted px-4 text-brutal-foreground">
              BUILDING.
            </span>
          </BrutalHeading>
          <p className="mx-auto mb-12 max-w-lg font-bold uppercase opacity-40">
            지금 로그인하고 무료 크레딧을 받으세요.
            <br /> 코딩없이 AI 에이전트를 만드세요.
          </p>
          <BrutalButton
            variant="default"
            size="lg"
            className="bg-brutal-background text-brutal-foreground hover:bg-brutal-muted hover:text-brutal-foreground"
            asChild
          >
            <Link href="/workflows/canvas">시작하기</Link>
          </BrutalButton>
        </div>
      </BrutalSection>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-12 py-24 text-sm font-black tracking-[0.6em] uppercase italic opacity-40 md:flex-row"></footer>
    </div>
  );
}
