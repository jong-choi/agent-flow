import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import {
  AIMessage,
  mapChatMessagesToStoredMessages,
} from "@langchain/core/messages";
import { checkModelSchema, migrateModelSchema } from "./lib/model-release";

async function main() {
  const readDown = await readFile(
    "migrations/execution-billing/001-down.sql",
    "utf8",
  );
  const original = process.env.DATABASE_URL!;
  const url = new URL(original);
  assert.equal(url.hostname, "127.0.0.1");
  const mode = process.argv[2] ?? "fresh";
  const name = `agentflow_release_${randomUUID().replaceAll("-", "")}`;
  const admin = postgres(original, { max: 1 });
  await admin.unsafe(`create database "${name}"`);
  url.pathname = "/" + name;
  const db = postgres(url.toString(), { max: 1, onnotice: () => {} });
  try {
    if (mode === "legacy") {
      await db.unsafe(
        await readFile(
          "src/testing/fixtures/model-registry-legacy.sql",
          "utf8",
        ),
      );
      await db.unsafe(
        `create table "user"(id text primary key);create table credit_accounts(user_id text primary key references "user"(id),balance integer not null default 0,total_earned integer not null default 0,total_spent integer not null default 0,updated_at timestamp not null default now(),created_at timestamp not null default now());create table credit_transactions(id uuid primary key default gen_random_uuid(),user_id text not null references "user"(id),type text not null,category text not null,title text not null,description text,amount integer not null,occurred_at timestamp not null default now());create table chat_messages(id uuid primary key default gen_random_uuid(),chat_id uuid,role text,content text,created_at timestamp default now());`,
      );
    }
    await migrateModelSchema(url.toString());
    await migrateModelSchema(url.toString());
    assert.equal((await checkModelSchema(url.toString())).schemaReady, true);
    process.env.DATABASE_URL = url.toString();
    const { seedAiModels } = await import("../src/db/seed/ai-models");
    await seedAiModels();
    await seedAiModels();
    const registry = await import("../src/lib/ai/registry-store");
    const model = (await registry.listModelRegistry()).find(
      (m) =>
        m.provider === "groq" && m.upstreamModelId === "openai/gpt-oss-20b",
    )!;
    assert.ok(model);
    const before =
      await db`select value,pos_x,pos_y from workflow_nodes where type='chatNode' order by id`;
    const { applyCatalog, planCatalog } = await import(
      "../src/lib/ai/maintenance/catalog-store"
    );
    const snapshot = {
      provider: "groq" as const,
      modelIds: [model.upstreamModelId],
      models: [
        {
          provider: "groq",
          upstreamModelId: model.upstreamModelId,
          displayName: "Updated from fixture",
          metadata: {},
        },
      ],
      fetchedAt: Date.now(),
    };
    await planCatalog(snapshot);
    await applyCatalog(snapshot, false);
    assert.equal(
      (await registry.getModelByReference(model.id))!.price,
      model.price,
    );
    assert.deepEqual(
      [
        ...(await db`select value,pos_x,pos_y from workflow_nodes where type='chatNode' order by id`),
      ],
      [...before],
    );
    // Empty billing metadata is reversible, then forward migration is repeatable.
    await db.begin((tx) => tx.unsafe(readDown));
    await migrateModelSchema(url.toString());
    const user = "release-fixture";
    await db`insert into "user"(id) values(${user})`;
    await db`insert into credit_accounts(user_id,balance,total_earned) values(${user},20,20)`;
    const billing = await import("../src/lib/ai/billing");
    const context = {
      userId: user,
      threadId: "fixture",
      nodeId: "chat",
      executionKey: "first",
    };
    const first = await billing.reserveModelCredits(model, context);
    const insufficient = await Promise.allSettled([
      billing.reserveModelCredits(model, { ...context, executionKey: "other" }),
    ]);
    assert.equal(insufficient[0].status, "rejected");
    assert.equal(
      (await db`select balance from credit_accounts where user_id=${user}`)[0]
        .balance,
      5,
    );
    await billing.releaseModelCredits(first.id);
    await billing.releaseModelCredits(first.id);
    assert.equal(
      (await db`select balance from credit_accounts where user_id=${user}`)[0]
        .balance,
      20,
    );
    const retry = await billing.reserveModelCredits(model, context);
    assert.equal(first.id, retry.id);
    const result = mapChatMessagesToStoredMessages([new AIMessage("정답")]);
    await Promise.all([
      billing.settleModelCredits(retry.id, result, "fixture"),
      billing.settleModelCredits(retry.id, result, "fixture"),
    ]);
    await billing.releaseModelCredits(retry.id);
    assert.ok((await billing.reserveModelCredits(model, context)).cached);
    assert.equal(
      (await db`select count(*)::int n from credit_transactions`)[0].n,
      1,
    );
    assert.equal(
      (
        await db`select balance,total_spent from credit_accounts where user_id=${user}`
      )[0].total_spent,
      15,
    );
    await assert.rejects(
      () => db.begin((tx) => tx.unsafe(readDown)),
      /Billing evidence exists/,
    );
    await migrateModelSchema(url.toString());
    assert.equal(
      (await db`select count(*)::int n from credit_transactions`)[0].n,
      1,
    );
    await db`update credit_accounts set balance=30 where user_id=${user}`;
    const crash = await billing.reserveModelCredits(model, {
      ...context,
      executionKey: "crashed",
    });
    await db`update ai_execution_billing set expires_at=now()-interval '1 hour' where execution_id=${crash.id}`;
    assert.equal(await billing.releaseExpiredModelCredits(), 1);
    assert.equal(
      (await db`select balance from credit_accounts where user_id=${user}`)[0]
        .balance,
      30,
    );
    console.log(
      `PASS ${mode}: migrate/repeat/seed/sync/rollback/forward-fix; reservations, insufficient funds, release, idempotent receipt/replay, crash recovery`,
    );
  } finally {
    process.env.DATABASE_URL = original;
    await db.end();
    await admin.unsafe(`drop database "${name}" with (force)`);
    await admin.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
