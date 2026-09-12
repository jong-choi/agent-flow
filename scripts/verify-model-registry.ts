import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

async function main() {
  const originalUrl = process.env.DATABASE_URL!;
  const url = new URL(originalUrl);
  assert.equal(
    url.hostname,
    "127.0.0.1",
    "Integration tests require local PostgreSQL",
  );
  const name = `agentflow_registry_${randomUUID().replaceAll("-", "")}`;
  const admin = postgres(originalUrl, { max: 1 });
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
  try {
    const up = await readFile("migrations/model-registry/001-up.sql", "utf8");
    const down = await readFile(
      "migrations/model-registry/001-down.sql",
      "utf8",
    );
    await sql.unsafe(
      await readFile("src/testing/fixtures/model-registry-legacy.sql", "utf8"),
    );
    const before = await sql`select * from workflow_nodes order by id`;
    await sql.begin((tx) => tx.unsafe(up));
    await sql.begin((tx) => tx.unsafe(up));
    const after = await sql`select * from workflow_nodes order by id`;
    assert.equal(after[0].value, "11111111-1111-4111-8111-111111111111");
    assert.equal(after[1].value, "already-removed-model");
    assert.equal(after[2].value, "openai/gpt-oss-20b");
    assert.deepEqual(
      after.map((node) => ({ ...node, value: null })),
      before.map((node) => ({ ...node, value: null })),
    );
    for (const table of ["workflow_edges", "presets", "chats"])
      assert.equal(
        (await sql.unsafe(`select count(*)::int as count from ${table}`))[0]
          .count,
        1,
      );
    await sql.begin((tx) => tx.unsafe(down));
    assert.deepEqual(
      [...(await sql`select * from workflow_nodes order by id`)],
      [...before],
    );
    await sql.begin((tx) => tx.unsafe(up));
    process.env.DATABASE_URL = url.toString();
    const registry = await import("../src/lib/ai/registry-store");
    const { seedAiModels } = await import("../src/db/seed/ai-models");
    const id = "11111111-1111-4111-8111-111111111111";
    assert.equal(
      (await registry.getModelByReference("openai/gpt-oss-20b"))?.id,
      id,
    );
    await registry.updateModelSettings(id, {
      name: "Custom card",
      price: 77,
      order: 42,
      isActive: false,
      description: "Operator description",
      appMaxInputTokens: 2048,
      appMaxOutputTokens: 512,
    });
    await seedAiModels();
    await seedAiModels();
    await registry.upsertCatalogModel({
      provider: "groq",
      upstreamModelId: "openai/gpt-oss-20b",
      displayName: "Provider renamed",
      contextWindow: 100000,
      metadata: { version: "new", outputTokenLimit: 256 },
    });
    await registry.upsertCatalogModel({
      provider: "groq",
      upstreamModelId: "openai/gpt-oss-20b",
      displayName: "Partial update",
      metadata: { version: "newer" },
    });
    const model = (await registry.getModelByReference(id))!;
    assert.equal(model.name, "Custom card");
    assert.equal(model.price, 77);
    assert.equal(model.order, 42);
    assert.equal(model.isActive, false);
    assert.equal(model.description, "Operator description");
    assert.equal(model.contextWindow, 100000);
    assert.equal(model.catalogMetadata.outputTokenLimit, 256);
    const other = await registry.upsertCatalogModel({
      provider: "ollama",
      upstreamModelId: model.upstreamModelId,
      displayName: "Other provider",
      metadata: {},
    });
    const repeat = await registry.upsertCatalogModel({
      provider: "ollama",
      upstreamModelId: model.upstreamModelId,
      displayName: "New name",
      metadata: { version: "2" },
    });
    assert.notEqual(other.id, id);
    assert.equal(repeat.id, other.id);
    assert.equal(other.isActive, false);
    assert.equal(other.lifecycle, "candidate");
    await registry.updateModelSettings(id, { isActive: true });
    const snapshot = await registry.startModelExecution(
      (await registry.getModelByReference(id))!,
      { userId: "test-user", threadId: "test-thread", nodeId: "chat-node" },
    );
    await registry.updateModelSettings(id, { price: 99 });
    await registry.finishModelExecution(snapshot.id, "succeeded");
    const [execution] =
      await sql`select * from ai_model_executions where id=${snapshot.id}`;
    assert.equal(execution.credits, 77);
    assert.equal(execution.output_limit, 256);
    assert.equal(execution.status, "succeeded");
    await assert.rejects(
      () => sql.begin((tx) => tx.unsafe(down)),
      /rollback would lose information/,
    );
    console.log(
      "PASS: migration/repeat/rollback, legacy + UUID resolution, graph/preset/chat preservation, seed/catalog operator protection, provider identity, execution price snapshot",
    );
  } finally {
    process.env.DATABASE_URL = originalUrl;
    await sql.end();
    await admin.unsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
