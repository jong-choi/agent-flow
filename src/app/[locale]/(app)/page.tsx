import {
  ArrowRight,
  Blocks,
  LayoutGrid,
  MessageSquareText,
  Workflow,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LandingSectionBackdrop } from "@/components/landing/landing-section-backdrop";
import { Button } from "@/components/ui/button";
import { type AppMessageKeys } from "@/lib/i18n/messages";
import { Link } from "@/lib/i18n/navigation";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getTranslations<AppMessageKeys>({
    locale,
    namespace: "Home",
  });
  const loginLabel = t("cta.login");

  return (
    <div className="scrollbar-slim relative h-full w-full snap-y snap-mandatory overflow-y-auto bg-background text-foreground">
      <section className="relative isolate flex min-h-[100dvh] snap-start items-center overflow-hidden border-b border-border/70">
        <LandingSectionBackdrop options={{ variant: "infinite-nodes" }} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-8">
            <p className="inline-flex rounded-full border border-border/50 bg-accent/25 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-muted-foreground">
              AGENTFLOW
            </p>
            <h1 className="text-4xl font-black tracking-tight whitespace-pre-line text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild className="rounded-full">
                <Link href="/login">
                  {loginLabel}
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-border/50 bg-accent/25 p-5 backdrop-blur-xl">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                <LayoutGrid size={20} />
              </div>
              <p className="text-lg font-semibold text-foreground">
                {t("features.canvas.title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("features.canvas.desc")}
              </p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-accent/25 p-5 backdrop-blur-xl">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <Workflow size={20} />
              </div>
              <p className="text-lg font-semibold text-foreground">
                {t("features.workflows.title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("features.workflows.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate flex min-h-[100dvh] snap-start items-center overflow-hidden border-b border-border/70">
        <LandingSectionBackdrop options={{ variant: "hero" }} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-2">
          <div className="rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-300">
              <LayoutGrid size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("features.canvas.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t("features.canvas.desc")}
            </p>
          </div>

          <div className="rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-border/50 bg-accent/25 p-4">
                <p className="font-semibold text-indigo-700 dark:text-indigo-200">
                  Trigger
                </p>
                <p className="mt-2 text-xs text-muted-foreground">User Event</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-accent/25 p-4">
                <p className="font-semibold text-cyan-700 dark:text-cyan-200">
                  Search
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Web / DB</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-accent/25 p-4">
                <p className="font-semibold text-violet-700 dark:text-violet-200">
                  Reason
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Model Chain
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-accent/25 p-4">
                <p className="font-semibold text-emerald-700 dark:text-emerald-200">
                  Output
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Action + Reply
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate flex min-h-[100dvh] snap-start items-center overflow-hidden border-b border-border/70">
        <LandingSectionBackdrop options={{ variant: "grid-waving" }} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300">
              <MessageSquareText size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("features.chat.title")}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {t("features.chat.desc")}
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="ml-10 max-w-sm rounded-2xl bg-blue-500/12 px-4 py-3 text-sm text-foreground/90">
              Multi-model response planning completed.
            </div>
            <div className="mr-8 max-w-sm rounded-2xl bg-foreground px-4 py-3 text-sm text-background">
              Context memory synced and action graph is ready.
            </div>
            <div className="ml-6 max-w-sm rounded-2xl bg-cyan-500/12 px-4 py-3 text-sm text-foreground/90">
              Search + reasoning + tool calls can run in one stream.
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="rounded-xl border border-border/50 bg-accent/25 px-2 py-2">
                Memory
              </div>
              <div className="rounded-xl border border-border/50 bg-accent/25 px-2 py-2">
                Search
              </div>
              <div className="rounded-xl border border-border/50 bg-accent/25 px-2 py-2">
                Action
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate flex min-h-[100dvh] snap-start items-center overflow-hidden border-b border-border/70">
        <LandingSectionBackdrop options={{ variant: "workflows" }} />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-2xl rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              <Workflow size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("features.workflows.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t("features.workflows.desc")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border/50 bg-accent/25 p-5 backdrop-blur-xl">
              <p className="text-sm font-semibold text-muted-foreground">
                STEP 01
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Trigger
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Event, schedule, or webhook starts the flow.
              </p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-accent/25 p-5 backdrop-blur-xl">
              <p className="text-sm font-semibold text-muted-foreground">
                STEP 02
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Decide
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Conditional logic chooses tools and model routes.
              </p>
            </div>
            <div className="rounded-3xl border border-border/50 bg-accent/25 p-5 backdrop-blur-xl">
              <p className="text-sm font-semibold text-muted-foreground">
                STEP 03
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Deliver
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Output reaches chat, API, or downstream systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate flex min-h-[100dvh] snap-start items-center overflow-hidden">
        <LandingSectionBackdrop options={{ variant: "presets" }} />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <Blocks size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("features.presets.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t("features.presets.desc")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-xl border border-border/50 bg-accent/25 px-3 py-2 text-xs font-medium">
                Customer Support
              </span>
              <span className="rounded-xl border border-border/50 bg-accent/25 px-3 py-2 text-xs font-medium">
                Research Agent
              </span>
              <span className="rounded-xl border border-border/50 bg-accent/25 px-3 py-2 text-xs font-medium">
                Lead Qualifier
              </span>
              <span className="rounded-xl border border-border/50 bg-accent/25 px-3 py-2 text-xs font-medium">
                Prompt Studio
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/50 bg-accent/25 p-6 backdrop-blur-xl">
            <Button asChild className="h-auto w-full rounded-2xl px-5 py-3">
              <Link href="/login">
                {loginLabel}
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
