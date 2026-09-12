import "dotenv/config";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { db } from "../src/db/client";
import {
  freeAccessPolicies,
  maintenanceEvents,
  maintenanceJobs,
  modelChecks,
  modelHealth,
  providerHealth,
} from "../src/db/schema/ai-maintenance";
import { aiModels } from "../src/db/schema/ai-models";
import { releaseExpiredModelCredits } from "../src/lib/ai/billing";
import { runAiCall } from "../src/lib/ai/execution";
import {
  applyCatalog,
  planCatalog,
} from "../src/lib/ai/maintenance/catalog-store";
import {
  type Provider,
  collectCatalog,
  providers,
} from "../src/lib/ai/maintenance/collectors";
import { DAY, initialHealth } from "../src/lib/ai/maintenance/policy";
import { probeModel } from "../src/lib/ai/maintenance/probes";
import {
  credentialVersion,
  providerKeys,
} from "../src/lib/ai/maintenance/state-store";
import {
  maintenanceLoop,
  noticeUrls,
  runMaintenanceTick,
} from "../src/lib/ai/maintenance/worker";
import { captureNetwork } from "./lib/network-capture";

let finishCapture: () => Promise<void> = async () => {};

async function main() {
  finishCapture = await captureNetwork(process.env.AI_DIAGNOSTIC_DIR);
  const [command, arg, file] = process.argv.slice(2);
  const apply = process.argv.includes("--apply");
  if ((command !== "status" && command !== "sync") || apply) {
    if (
      new URL(process.env.DATABASE_URL!).hostname !== "127.0.0.1" &&
      process.env.AI_MAINTENANCE_ENABLED !== "true"
    )
      throw Error(
        "Writes require local DB; production worker must be explicitly enabled at deployment",
      );
  }
  if (command === "reconcile-credits") {
    if (!apply) throw Error("Use --apply to release expired reservations");
    console.log({
      released: await runAiCall(() => releaseExpiredModelCredits()),
    });
    return;
  }
  if (command === "status") {
    console.log(
      JSON.stringify(
        {
          jobs: await db.select().from(maintenanceJobs),
          models: await db.select().from(modelHealth),
          providers: (await db.select().from(providerHealth)).map(
            ({ provider, state }) => ({ provider, state }),
          ),
          checks: await db
            .select()
            .from(modelChecks)
            .orderBy(desc(modelChecks.checkedAt))
            .limit(20),
          events: await db
            .select()
            .from(maintenanceEvents)
            .orderBy(desc(maintenanceEvents.createdAt))
            .limit(30),
        },
        null,
        2,
      ),
    );
    return;
  }
  if (command === "sync") {
    const provider = z.enum(providers).parse(arg);
    const snapshot = await collectCatalog(provider);
    console.log(
      JSON.stringify(
        apply
          ? await applyCatalog(snapshot, process.argv.includes("--discover"))
          : await planCatalog(snapshot),
        null,
        2,
      ),
    );
    return;
  }
  if (command === "probe") {
    if (!apply) throw Error("Probe consumes API quota; use --apply");
    console.log(
      await probeModel(z.uuid().parse(arg), {
        verifyCandidate: process.argv.includes("--candidate"),
      }),
    );
    return;
  }
  if (command === "once") {
    if (!apply) throw Error("Use --apply to execute one due maintenance job");
    console.log(await runMaintenanceTick());
    return;
  }
  if (command === "worker") {
    const stop = new AbortController();
    process.once("SIGTERM", () => stop.abort());
    process.once("SIGINT", () => stop.abort());
    await maintenanceLoop(stop.signal);
    return;
  }
  if (command === "confirm-free") {
    if (!apply)
      throw Error("Use --apply after reviewing account and model eligibility");
    const provider = z.enum(providers).parse(arg);
    const input = z
      .object({
        freeAccount: z.literal(true),
        purchasedCredits: z.literal(false),
        modelIds: z.array(z.string().min(1)).min(1),
        sourceUrl: z.url(),
        expiresAt: z.iso.datetime(),
      })
      .strict()
      .parse(JSON.parse(await readFile(file, "utf8")));
    if (!process.env[providerKeys[provider]])
      throw Error("Provider key is not configured");
    const expiresAt = new Date(input.expiresAt);
    if (
      expiresAt.getTime() <= Date.now() ||
      expiresAt.getTime() > Date.now() + 7 * DAY
    )
      throw Error("Free-access verification must expire within seven days");
    const policy = {
      provider,
      credentialVersion: credentialVersion(provider),
      modelIds: input.modelIds,
      sourceUrl: input.sourceUrl,
      expiresAt,
      verifiedAt: new Date(),
    };
    await db
      .insert(freeAccessPolicies)
      .values(policy)
      .onConflictDoUpdate({ target: freeAccessPolicies.provider, set: policy });
    console.log(
      "Free-access allowlist saved with expiry; no account settings changed",
    );
    return;
  }
  if (command === "retirement") {
    if (!apply) throw Error("Use --apply for a reviewed retirement plan");
    const id = z.uuid().parse(arg);
    const input = z
      .object({
        at: z.iso.datetime(),
        reason: z.string().min(1),
        sourceUrl: z.url(),
        replacementId: z.uuid().nullable(),
      })
      .strict()
      .parse(JSON.parse(await readFile(file, "utf8")));
    const [model] = await db.select().from(aiModels).where(eq(aiModels.id, id));
    if (!model) throw Error("Unknown model");
    if (model.lifecycle === "retired")
      throw Error("A retired model cannot be rescheduled");
    const source = new URL(input.sourceUrl);
    if (
      source.protocol !== "https:" ||
      source.hostname !==
        new URL(noticeUrls[model.provider as Provider]).hostname
    )
      throw Error("Use this provider's official retirement source");
    if (input.replacementId === id)
      throw Error("A model cannot replace itself");
    await db
      .update(aiModels)
      .set({
        lifecycle: "deprecated",
        retirementAt: new Date(input.at),
        retirementReason: input.reason,
        retirementSourceUrl: input.sourceUrl,
        replacementModelId: input.replacementId,
      })
      .where(and(eq(aiModels.id, id), ne(aiModels.lifecycle, "retired")));
    console.log("Reviewed retirement plan saved");
    return;
  }
  if (command === "reset") {
    if (!apply)
      throw Error(
        "Use --apply to reset health (does not unretire/unhide models)",
      );
    const id = z.uuid().parse(arg);
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(21465,4)`);
      await tx
        .insert(modelHealth)
        .values({ modelId: id, state: initialHealth() })
        .onConflictDoUpdate({
          target: modelHealth.modelId,
          set: { state: initialHealth(), updatedAt: new Date() },
        });
      await tx
        .update(aiModels)
        .set({ health: "healthy" })
        .where(and(eq(aiModels.id, id)));
    });
    console.log("Model health reset");
    return;
  }
  throw Error(
    "Usage: maintenance status | sync provider [--discover --apply] | probe UUID --apply | once --apply | worker | confirm-free provider file --apply | retirement UUID file --apply | reset UUID --apply",
  );
}
void main()
  .then(async () => {
    await finishCapture();
    process.exit(0);
  })
  .catch(async (error) => {
    await finishCapture();
    console.error(
      error instanceof Error ? error.message : "Maintenance failed",
    );
    process.exit(1);
  });
