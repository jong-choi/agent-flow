import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { normalizeProviderError } from "../src/lib/ai/error";
import { DAY, HOUR, MINUTE } from "../src/lib/ai/maintenance/policy";

async function main() {
  const original = process.env.DATABASE_URL!;
  const url = new URL(original);
  assert.equal(url.hostname, "127.0.0.1");
  const name = `agentflow_maintenance_${randomUUID().replaceAll("-", "")}`;
  const admin = postgres(original, { max: 1 });
  await admin.unsafe(`create database "${name}"`);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(
      await readFile("src/testing/fixtures/model-registry-legacy.sql", "utf8"),
    );
    for (const path of [
      "migrations/model-registry/001-up.sql",
      "migrations/model-maintenance/001-up.sql",
    ]) {
      const text = await readFile(path, "utf8");
      await sql.begin((tx) => tx.unsafe(text));
    }
    process.env.DATABASE_URL = url.toString();
    process.env.GROQ_API_KEY = "fixture-groq";
    process.env.OLLAMA_API_KEY = "fixture-ollama";
    const registry = await import("../src/lib/ai/registry-store");
    const health = await import("../src/lib/ai/maintenance/state-store");
    const catalog = await import("../src/lib/ai/maintenance/catalog-store");
    const probes = await import("../src/lib/ai/maintenance/probes");
    const worker = await import("../src/lib/ai/maintenance/worker");
    const id = "11111111-1111-4111-8111-111111111111";
    const model = (await registry.getModelByReference(id))!;
    const now = Date.now();
    for (let n = 0; n < 3; n++)
      await health.recordObservation(model, {
        ok: false,
        source: "runtime",
        at: now + n * MINUTE,
        error: normalizeProviderError({ status: 503 }),
      });
    assert.equal((await registry.getModelByReference(id))!.health, "cooldown");
    await health.recordObservation(model, {
      ok: false,
      source: "runtime",
      at: now + 3 * MINUTE,
      error: normalizeProviderError({
        status: 429,
        headers: { "retry-after": "3600" },
      }),
    });
    const blocked = (
      await health.availabilityMap(
        [(await registry.getModelByReference(id))!],
        now + 4 * MINUTE,
      )
    ).get(id)!;
    assert.equal(blocked.reason, "quota");
    const [paused] =
      await sql`select state from ai_model_health where model_id=${id}`;
    assert.equal(paused.state.firstFailureAt, null);
    await health.recordObservation(model, {
      ok: true,
      source: "probe",
      at: now + 2 * HOUR,
    });
    await health.recordObservation(model, {
      ok: true,
      source: "probe",
      at: now + 2 * HOUR + 5 * MINUTE,
    });
    await registry.updateModelSettings(id, { isActive: false, price: 77 });
    await health.recordObservation(model, {
      ok: true,
      source: "runtime",
      at: now + 3 * HOUR,
    });
    assert.equal((await registry.getModelByReference(id))!.isActive, false);
    assert.equal(
      (await registry.getModelByReference(id))!.promotionBlocked,
      true,
    );
    await registry.updateModelSettings(id, { isActive: true });
    const other = await registry.upsertCatalogModel({
      provider: "groq",
      upstreamModelId: "other",
      displayName: "Other",
      metadata: {},
    });
    await sql`update ai_models set lifecycle='active',is_active=true,price=1 where id=${other.id}`;
    const snapshot = {
      provider: "groq" as const,
      modelIds: [model.upstreamModelId, "other", "spare1", "spare2"],
      models: [],
      fetchedAt: now + 4 * HOUR,
    };
    const countBefore = (
      await sql`select count(*)::int n from ai_catalog_runs`
    )[0].n;
    await catalog.planCatalog(snapshot);
    assert.equal(
      (await sql`select count(*)::int n from ai_catalog_runs`)[0].n,
      countBefore,
    );
    await catalog.applyCatalog(snapshot, false);
    const missing = { ...snapshot, modelIds: ["other", "spare1", "spare2"] };
    for (let day = 0; day < 3; day++) {
      const time = now + 5 * HOUR + day * DAY;
      await health.recordObservation(other, {
        ok: true,
        source: "runtime",
        at: time,
      });
      if (day === 0)
        await health.recordObservation(model, {
          ok: false,
          source: "probe",
          at: time,
          error: normalizeProviderError({
            status: 404,
            message: "model example not found",
          }),
        });
      await catalog.applyCatalog({ ...missing, fetchedAt: time }, false);
    }
    assert.equal(
      (await registry.getModelByReference(id))!.lifecycle,
      "retired",
    );
    assert.equal((await registry.getModelByReference(id))!.price, 77);
    const rejection = await catalog.applyCatalog(
      { ...snapshot, modelIds: [], fetchedAt: now + 3 * DAY },
      false,
    );
    assert.equal(rejection.accepted, false);
    await catalog.applyCatalog(
      {
        provider: "ollama",
        modelIds: ["candidate"],
        models: [
          {
            provider: "ollama",
            upstreamModelId: "candidate",
            displayName: "Candidate",
            metadata: {},
          },
        ],
        fetchedAt: now,
      },
      true,
    );
    const candidate = (await registry.listModelRegistry()).find(
      (m) => m.provider === "ollama",
    )!;
    assert.equal(candidate.requireFreeAccess, true);
    assert.equal(
      (await probes.probeModel(candidate.id, { verifyCandidate: true })).status,
      "free_verification_required",
    );
    const reservations = await Promise.all(
      Array.from({ length: 11 }, () => probes.reserveProbe("groq", now)),
    );
    assert.equal(reservations.filter(Boolean).length, 10);
    await sql`insert into ai_free_access_policies(provider,credential_version,model_ids,source_url,expires_at) values('ollama',${health.credentialVersion("ollama")},${sql.json(["candidate"])},'https://ollama.com/pricing',${new Date(now + DAY)})`;
    await sql`update ai_models set lifecycle='active',is_active=true,entitlement='free_confirmed' where id=${candidate.id}`;
    const approved = (await registry.getModelByReference(candidate.id))!;
    assert.equal(
      (await health.availabilityMap([approved], now)).get(approved.id)
        ?.available,
      true,
    );
    assert.equal(
      (await health.availabilityMap([approved], now + 2 * DAY)).get(approved.id)
        ?.available,
      false,
    );
    await worker.applyScheduledRetirements(now + 2 * DAY);
    assert.equal(
      (await registry.getModelByReference(candidate.id))!.entitlement,
      "unknown",
    );
    // Distinct models fail without an intervening success: provider circuit, not mass retirement.
    const third = await registry.upsertCatalogModel({
      provider: "groq",
      upstreamModelId: "third",
      displayName: "Third",
      metadata: {},
    });
    for (const m of [model, other, third])
      await health.recordObservation(m, {
        ok: false,
        source: "runtime",
        at: now + 4 * DAY,
        error: normalizeProviderError({ status: 503 }),
      });
    const [provider] =
      await sql`select state from ai_provider_health where provider='groq'`;
    assert.equal(provider.state.reason, "provider_outage");
    // A provider cooldown becoming due must trigger a recovery probe even when
    // the selected model's normal daily check is still in the future.
    await sql`update ai_provider_health set state=state || ${sql.json({ nextProbeAt: Date.now() - 1, probeModelId: other.id })}::jsonb where provider='groq'`;
    await sql`update ai_model_health set state=state || ${sql.json({ nextProbeAt: Date.now() + DAY })}::jsonb where model_id=${other.id}`;
    await sql`update ai_probe_budgets set used=0 where provider='groq'`;
    await sql`update ai_models set is_active=false where id=${candidate.id}`;
    const nativeFetch = globalThis.fetch;
    let observedRequests = 0;
    globalThis.fetch = async (input) => {
      assert.equal(
        new URL(input instanceof Request ? input.url : String(input)).hostname,
        "api.groq.com",
      );
      observedRequests++;
      return Response.json({
        id: "mock-recovery",
        object: "chat.completion",
        created: 1,
        model: "other",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "20분" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 2, completion_tokens: 2, total_tokens: 4 },
      });
    };
    try {
      const recovery = await probes.runDueProbes();
      assert.ok(
        recovery.some((r) => r.id === other.id && r.status === "passed"),
      );
      assert.equal(
        observedRequests,
        1,
        "Recovery probe is mocked, never a real API request",
      );
    } finally {
      globalThis.fetch = nativeFetch;
    }
    await worker.initializeJobs(now);
    // Official discovery must reach selectable activation without a manual
    // INSERT, seed, or per-model free-policy command. Network is mocked here.
    await sql`update ai_maintenance_jobs set next_run_at=${new Date(Date.now() + 15 * MINUTE)} where key='probes'`;
    await catalog.applyCatalog(
      {
        provider: "ollama",
        modelIds: ["candidate", "gpt-oss:20b"],
        models: [
          {
            provider: "ollama",
            upstreamModelId: "gpt-oss:20b",
            displayName: "gpt-oss:20b",
            metadata: { sourceUrl: "https://ollama.com/api/tags" },
          },
        ],
        fetchedAt: Date.now(),
      },
      true,
    );
    const automatic = (await registry.listModelRegistry()).find(
      (m) => m.provider === "ollama" && m.upstreamModelId === "gpt-oss:20b",
    )!;
    assert.ok(
      (
        await sql`select next_run_at from ai_maintenance_jobs where key='probes'`
      )[0].next_run_at.getTime() <= Date.now(),
      "Discovery schedules immediate verification",
    );
    assert.equal(automatic.lifecycle, "candidate");
    assert.equal(automatic.price, 2);
    assert.equal(automatic.metadata?.thinkingLevel, "low");
    let autoCalls = 0;
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      assert.equal(new URL(request.url).origin, "https://ollama.com");
      const body = await request.json();
      autoCalls++;
      const result = {
        model: "gpt-oss:20b",
        created_at: new Date().toISOString(),
        message: { role: "assistant", content: "20분입니다." },
        done: true,
        done_reason: "stop",
        prompt_eval_count: 5,
        eval_count: 5,
        total_duration: 1,
        load_duration: 1,
        prompt_eval_duration: 1,
        eval_duration: 1,
      };
      return body.stream
        ? new Response(JSON.stringify(result) + "\n", {
            headers: { "content-type": "application/x-ndjson" },
          })
        : Response.json(result);
    };
    try {
      assert.equal(
        (await probes.probeModel(automatic.id, { verifyCandidate: true }))
          .status,
        "passed",
      );
      assert.equal(autoCalls, 2);
      const active = (await registry.getModelByReference(automatic.id))!;
      assert.equal(active.lifecycle, "active");
      assert.equal(
        (await health.availabilityMap([active])).get(active.id)?.available,
        true,
      );
      await registry.updateModelSettings(active.id, {
        isActive: false,
        price: 23,
      });
      assert.equal(
        (await probes.probeModel(active.id, { verifyCandidate: true })).status,
        "manual_hold",
      );
      assert.equal(autoCalls, 2, "Operator hold must not consume another call");
      assert.equal((await registry.getModelByReference(active.id))!.price, 23);
    } finally {
      globalThis.fetch = nativeFetch;
    }
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const running = worker.runMaintenanceTick({
      now,
      execute: async () => {
        started();
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      },
    });
    await Promise.race([
      ready,
      running.then(() => {
        throw Error("Worker did not start");
      }),
    ]);
    assert.equal(
      (
        await worker.runMaintenanceTick({
          now,
          execute: async () => {
            throw Error("duplicate worker");
          },
        })
      ).status,
      "busy",
    );
    release();
    assert.equal((await running).status, "completed");
    await sql`delete from ai_maintenance_jobs`;
    await sql`insert into ai_maintenance_jobs(key,next_run_at,lease_owner,lease_until) values('probes',${new Date(now)},'dead-worker',${new Date(now - 1)})`;
    assert.equal(await worker.claimJob("replacement-worker", now), "probes");
    console.log(
      "PASS: persisted cooldown/recovery, quota scope, manual hide, catalog guard/retirement, free expiry, probe budget, worker exclusion and stale lease recovery",
    );
  } finally {
    process.env.DATABASE_URL = original;
    await sql.end();
    await admin.unsafe(`drop database "${name}" with (force)`);
    await admin.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
