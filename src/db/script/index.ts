import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  const stmts = [
    `CREATE TABLE IF NOT EXISTS public.checkpoint_migrations ( v INTEGER PRIMARY KEY );`,
    `CREATE TABLE IF NOT EXISTS public.checkpoints (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      checkpoint_id TEXT NOT NULL,
      parent_checkpoint_id TEXT,
      type TEXT,
      checkpoint JSONB NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
    );`,
    `CREATE TABLE IF NOT EXISTS public.checkpoint_blobs (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL,
      version TEXT NOT NULL,
      type TEXT NOT NULL,
      blob BYTEA,
      PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
    );`,
    `CREATE TABLE IF NOT EXISTS public.checkpoint_writes (
      thread_id TEXT NOT NULL,
      checkpoint_ns TEXT NOT NULL DEFAULT '',
      checkpoint_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      idx INTEGER NOT NULL,
      channel TEXT NOT NULL,
      type TEXT,
      blob BYTEA NOT NULL,
      PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
    );`,
  ];

  for (const q of stmts) {
    await db.execute(sql.raw(q));
  }

  await pool.end();
  console.log("LangGraph checkpoint tables ensured.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
