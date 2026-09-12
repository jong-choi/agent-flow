import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

export const modelMigrations = [
  "model-registry",
  "provider-history",
  "model-maintenance",
  "execution-billing",
  "schema-integrity",
];
export async function migrateModelSchema(url: string) {
  const db = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await db.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(21465,2)`;
      const [row] = await tx`select to_regclass('public.ai_models') as models`;
      if (!row.models) {
        const [count] =
          await tx`select count(*)::int n from pg_tables where schemaname='public'`;
        if (count.n !== 0)
          throw Error(
            "Unrecognized existing schema; bootstrap requires an empty DB",
          );
        await tx.unsafe(
          await readFile("migrations/bootstrap/001-schema.sql", "utf8"),
        );
      }
      for (const name of modelMigrations)
        await tx.unsafe(
          await readFile(`migrations/${name}/001-up.sql`, "utf8"),
        );
    });
    const checkpoints = PostgresSaver.fromConnString(url);
    try {
      await checkpoints.setup();
    } finally {
      await checkpoints.end();
    }
  } finally {
    await db.end();
  }
}
export async function checkModelSchema(url: string) {
  const db = postgres(url, { max: 1 });
  try {
    const expected = {
      checkpoints: ["thread_id", "checkpoint"],
      ai_models: [
        "upstream_model_id",
        "lifecycle",
        "health",
        "require_free_access",
        "replacement_model_id",
      ],
      chat_messages: ["model_messages"],
      ai_model_executions: ["user_id", "credits"],
      ai_execution_billing: ["execution_key", "status", "result"],
      ai_maintenance_jobs: ["lease_owner", "lease_until"],
      ai_free_access_policies: ["credential_version", "expires_at"],
    };
    const columns =
      await db`select table_name,column_name from information_schema.columns where table_schema='public'`;
    const missing = Object.entries(expected).flatMap(([table, names]) =>
      names
        .filter(
          (name) =>
            !columns.some(
              (c) => c.table_name === table && c.column_name === name,
            ),
        )
        .map((name) => `${table}.${name}`),
    );
    if (missing.length) throw Error("Schema not ready: " + missing.join(", "));
    const models =
      await db`select provider,lifecycle,count(*)::int count from ai_models group by provider,lifecycle order by provider,lifecycle`;
    const [pending] =
      await db`select count(*)::int count from ai_execution_billing where status='reserved'`;
    return { schemaReady: true, models, reservations: pending.count };
  } finally {
    await db.end();
  }
}
