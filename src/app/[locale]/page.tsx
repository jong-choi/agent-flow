import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LandingSectionBackdrop } from "@/components/landing/landing-section-backdrop";
import { BrutalBadge } from "@/components/main/ui/brutal-badge";
import { BrutalButton } from "@/components/main/ui/brutal-button";
import { BrutalCard } from "@/components/main/ui/brutal-card";
import { BrutalHeading } from "@/components/main/ui/brutal-heading";
import { BrutalHeadingAccent } from "@/components/main/ui/brutal-heading-accent";
import { BrutalSection } from "@/components/main/ui/brutal-section";
import {
  BrutalExpandLine,
  BrutalGrid,
  BrutalRadialGlow,
} from "@/components/main/ui/brutal-utils";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { resolveMetadataLocale } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Home",
  });

  return {
    title: "AgentFlow",
    description: t("metaDescription"),
  };
}

export default async function BrutalLandingPage({
  params,
}: PageProps<"/[locale]">) {
  const { locale: requestedLocale } = await params;
  const locale = resolveMetadataLocale(requestedLocale);
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Home",
  });
  const canvasNodes = [
    t("canvas.nodes.presets"),
    t("canvas.nodes.llmCall"),
    t("canvas.nodes.search"),
    t("canvas.nodes.document"),
    t("canvas.nodes.fanOut"),
    t("canvas.nodes.output"),
  ];
  const howItWorksSteps = [
    {
      step: "01",
      title: "Design",
      desc: t("howItWorks.designDesc"),
      variant: "default" as const,
    },
    {
      step: "02",
      title: "Configure",
      desc: t("howItWorks.configureDesc"),
      variant: "filled" as const,
    },
    {
      step: "03",
      title: "Chat",
      desc: t("howItWorks.chatDesc"),
      variant: "default" as const,
    },
    {
      step: "04",
      title: "Deploy",
      desc: t("howItWorks.deployDesc"),
      variant: "inverse" as const,
    },
  ];
  const presetCards = [
    {
      name: t("presets.items.customerSupport.name"),
      tag: t("presets.items.customerSupport.tag"),
      price: 1,
    },
    {
      name: t("presets.items.seoBlog.name"),
      tag: t("presets.items.seoBlog.tag"),
      price: 5,
    },
    {
      name: t("presets.items.projectManagement.name"),
      tag: t("presets.items.projectManagement.tag"),
      price: 0,
    },
    {
      name: t("presets.items.parallelCode.name"),
      tag: t("presets.items.parallelCode.tag"),
      price: 3,
    },
  ];
  const weekdays = [
    t("credits.days.mon"),
    t("credits.days.tue"),
    t("credits.days.wed"),
    t("credits.days.thu"),
    t("credits.days.fri"),
    t("credits.days.sat"),
    t("credits.days.sun"),
  ];
  const apiExampleCode = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "af-**********************",
  baseURL: "https://agentflow.jongchoi.com/api/v1/openai",
});

const result = await client.chat.completions.create({
  model: "af-id-*******************",
  messages: [{ role: "user", content: "${t("developerApi.examplePrompt")}" }],
});

console.log(result.choices[0].message.content);`;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-brutal-background font-sans text-brutal-foreground transition-colors duration-300">
      {/* 히어로 섹션 */}
      <BrutalSection container="hero" className="overflow-hidden" id="hero">
        <div className="relative z-10">
          <LandingSectionBackdrop options={{ variant: "infinite-nodes" }} />
          <div className="z-10 mb-12 border-l-[32px] border-brutal-foreground bg-brutal-muted/30 p-12 backdrop-blur-xs">
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
              <Link href="/workflows/canvas">{t("hero.ctaStart")}</Link>
            </BrutalButton>
            <p className="max-w-sm text-2xl leading-[1.1] font-black uppercase">
              {t("hero.subtitleLine1")}
              <br />
              <span className="text-brutal-muted-foreground">
                {t("hero.subtitleLine2")}
              </span>
            </p>
          </div>
        </div>
      </BrutalSection>

      {/* 캔버스 섹션 */}
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
              {t("canvas.descriptionLine1")} <br />
              {t("canvas.descriptionLine2")}
            </p>
            <BrutalButton
              variant="outline"
              className="border-brutal-background text-brutal-background hover:bg-brutal-background hover:text-brutal-foreground"
              asChild
            >
              <Link href="/workflows/canvas">{t("canvas.cta")} →</Link>
            </BrutalButton>
          </div>

          <BrutalCard
            variant="outline"
            padding="default"
            className="border-brutal-background/40 bg-transparent text-brutal-background"
          >
            <div className="grid grid-cols-3 gap-4">
              {canvasNodes.map((node, i) => (
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

      {/* 캔버스 섹션 보조 설명 */}
      <BrutalSection
        className="border-t-2 border-brutal-border"
        id="how-it-works"
      >
        <BrutalGrid>
          {howItWorksSteps.map((s) => {
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

      {/* AI Chat 섹션 */}
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
                {t("chat.demo.userLabel")}
              </span>
              {t("chat.demo.userMessage1")}
            </BrutalCard>
            <BrutalCard
              variant="inverse"
              className="mr-8 max-w-md p-5 font-bold uppercase"
            >
              <span className="mb-2 block text-sm tracking-widest opacity-60">
                {t("chat.demo.agentLabel")}
              </span>
              {t("chat.demo.agentMessage")}
            </BrutalCard>
            <BrutalCard
              variant="default"
              className="ml-4 max-w-md p-5 font-bold text-brutal-foreground uppercase"
            >
              <span className="mb-2 block text-sm tracking-widest text-brutal-muted-foreground uppercase">
                {t("chat.demo.userLabel")}
              </span>
              {t("chat.demo.userMessage2")}
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
              {t("chat.descriptionLine1")} <br />
              {t("chat.descriptionLine2")}
            </p>
          </div>
        </div>
        {/* Marquee */}
        <div className="relative z-10 mt-20 -mb-10 overflow-hidden border-y border-brutal-background/20 py-4">
          <div className="animate-ticker inline-flex w-max whitespace-nowrap will-change-transform">
            {Array(2)
              .fill([
                "GEMMA-3-1B",
                "GEMMA-3N-E4B",
                "GEMMA-3-4B",
                "GEMMA-3-27B",
                "GPT-OSS-20B",
                "GPT-OSS-120B",
                "LLAMA-3.1-8B",
                "LLAMA-4-SCOUT",
                "LLAMA-4-MAVERICK",
              ])
              .flat()
              .map((tech, i) => (
                <span
                  key={`${tech}-${i}`}
                  className="px-4 text-sm font-black tracking-widest uppercase italic opacity-30 transition-opacity hover:text-brutal-background hover:opacity-100"
                >
                  {tech}
                </span>
              ))}
          </div>
        </div>
      </BrutalSection>

      {/* 프리셋 섹션 */}
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
              {t("presets.descriptionLine1")} <br />
              {t("presets.descriptionLine2")}
            </p>
            <BrutalButton variant="outline" asChild>
              <Link href="/presets">{t("presets.cta")} →</Link>
            </BrutalButton>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {presetCards.map((preset) => (
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
                    {preset.price
                      ? t("presets.priceCredits", { count: preset.price })
                      : t("presets.free")}
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

      {/* 크레딧 섹션 */}
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
              {t("credits.descriptionLine1")} <br />
            </p>
            <BrutalButton
              variant="outline"
              className="mt-8 border-brutal-background text-brutal-background hover:bg-brutal-background hover:text-brutal-foreground"
              asChild
            >
              <Link href="/credits/attendance">{t("credits.cta")} →</Link>
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
                  {t("credits.currentBalance")}
                </div>
                <div className="text-4xl leading-none font-black text-brutal-primary italic">
                  1,240C
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekdays.map((day, i) => (
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

      {/* API콜 섹션 */}
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
              {t("developerApi.descriptionLine1")}
              <br />
              {t("developerApi.descriptionLine2")}
            </p>
            <BrutalButton variant="outline" asChild>
              <Link href="/developers">{t("developerApi.cta")} →</Link>
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
            <pre className="overflow-x-auto opacity-70">{apiExampleCode}</pre>
          </BrutalCard>
        </div>
      </BrutalSection>

      {/* CTA */}
      <BrutalSection variant="inverse" className="overflow-hidden py-32">
        <LandingSectionBackdrop
          options={{
            variant: "grid-waving",
            tone: "inverse",
            dotRadius: 0.8,
            spreadXBase: 42,
            spreadXDepthBoost: 24,
          }}
        />
        <BrutalRadialGlow />
        <div className="relative z-10 mx-auto max-w-7xl px-12 text-center">
          <BrutalHeading variant="h2" className="mb-8 md:text-8xl">
            START
            <br />
            <span className="mt-4 inline-block bg-brutal-muted px-4 text-brutal-foreground">
              BUILDING.
            </span>
          </BrutalHeading>
          <p className="mx-auto mb-12 max-w-lg font-bold uppercase opacity-40">
            {t("cta.descriptionLine1")}
            <br /> {t("cta.descriptionLine2")}
          </p>
          <BrutalButton
            variant="default"
            size="lg"
            className="bg-brutal-background text-brutal-foreground hover:bg-brutal-muted hover:text-brutal-foreground"
            asChild
          >
            <Link href="/workflows/canvas">{t("cta.button")}</Link>
          </BrutalButton>
        </div>
      </BrutalSection>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-12 py-24 text-sm font-black tracking-[0.6em] uppercase italic opacity-40 md:flex-row"></footer>
    </div>
  );
}
