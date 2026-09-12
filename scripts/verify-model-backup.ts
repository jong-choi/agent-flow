import "dotenv/config";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import postgres from "postgres";
import { checkModelSchema, migrateModelSchema } from "./lib/model-release";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.equal(url.hostname, "127.0.0.1");
  const container = process.env.REHEARSAL_BACKUP_CONTAINER;
  if (!container)
    throw Error(
      "Set REHEARSAL_BACKUP_CONTAINER to the local Postgres container",
    );
  const prefix = "agentflow_backup_" + randomUUID().replaceAll("-", "");
  const source = prefix + "_source",
    target = prefix + "_restore";
  const admin = postgres(url.toString(), { max: 1 });
  try {
    await admin.unsafe(`create database "${source}"`);
    await admin.unsafe(`create database "${target}"`);
    url.pathname = "/" + source;
    await migrateModelSchema(url.toString());
    const db = postgres(url.toString(), { max: 1 });
    const id = randomUUID();
    await db`insert into ai_models(id,model_id,upstream_model_id,provider,name,price) values(${id},'backup-fixture','backup-fixture','groq','Backup fixture',17)`;
    await db.end();
    const dump = spawnSync(
      "docker",
      ["exec", container, "pg_dump", "-U", "agentflow", "-d", source, "-Fc"],
      { maxBuffer: 16 * 1024 * 1024, timeout: 60000 },
    );
    assert.equal(dump.status, 0, "pg_dump failed");
    await mkdir(".local/backups", { recursive: true, mode: 0o700 });
    await writeFile(".local/backups/stage5-fixture.dump", dump.stdout, {
      mode: 0o600,
    });
    const restore = spawnSync(
      "docker",
      [
        "exec",
        "-i",
        container,
        "pg_restore",
        "-U",
        "agentflow",
        "-d",
        target,
        "--exit-on-error",
      ],
      { input: dump.stdout, maxBuffer: 1024 * 1024, timeout: 60000 },
    );
    assert.equal(restore.status, 0, "pg_restore failed");
    url.pathname = "/" + target;
    assert.equal((await checkModelSchema(url.toString())).schemaReady, true);
    const restored = postgres(url.toString(), { max: 1 });
    assert.equal(
      (await restored`select price from ai_models where id=${id}`)[0].price,
      17,
    );
    await restored.end();
    console.log(
      "PASS: pg_dump custom archive → separate DB restore, model identity/price/schema retained",
    );
  } finally {
    for (const name of [source, target])
      await admin.unsafe(`drop database if exists "${name}" with (force)`);
    await admin.end();
  }
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
