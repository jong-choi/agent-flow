import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { AIMessage } from "@langchain/core/messages";
import { restoreChatMessage, storeModelMessages } from "../src/lib/ai/history";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.equal(url.hostname, "127.0.0.1");
  const name = `agentflow_history_${randomUUID().replaceAll("-", "")}`;
  const admin = postgres(url.toString(), { max: 1 });
  await admin.unsafe(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  const sql = postgres(url.toString(), { max: 1, onnotice: () => {} });
  try {
    await sql`create table chat_messages(id text primary key,role text,content text)`;
    const up = await readFile("migrations/provider-history/001-up.sql", "utf8"),
      down = await readFile("migrations/provider-history/001-down.sql", "utf8");
    await sql.begin((tx) => tx.unsafe(up));
    await sql.begin((tx) => tx.unsafe(up));
    await sql.begin((tx) => tx.unsafe(down));
    await sql.begin((tx) => tx.unsafe(up));
    const original = new AIMessage({
      id: "ai-id",
      content: [
        {
          type: "text",
          thought: true,
          text: "private thought",
          thoughtSignature: "opaque-signed-part",
        },
        { type: "text", text: "public answer" },
      ],
      tool_calls: [
        {
          id: "tool-id",
          name: "lookup",
          args: { key: "x" },
          type: "tool_call",
        },
      ],
    });
    await sql`insert into chat_messages(id,role,content,model_messages) values('row','assistant','public answer',${sql.json(JSON.parse(JSON.stringify(storeModelMessages([original]))))})`;
    const [row] =
      await sql`select id,role,content,model_messages as "modelMessages" from chat_messages where id='row'`;
    const restored = restoreChatMessage(
      row as {
        id: string;
        role: string;
        content: string;
        modelMessages: ReturnType<typeof storeModelMessages>;
      },
    );
    assert.deepEqual(restored[0].content, original.content);
    assert.deepEqual(
      (restored[0] as AIMessage).tool_calls,
      original.tool_calls,
    );
    await assert.rejects(
      () => sql.begin((tx) => tx.unsafe(down)),
      /Provider history exists/,
    );
    console.log(
      "PASS: history migration, safe rollback, PostgreSQL JSON signature/tool-call roundtrip",
    );
  } finally {
    await sql.end();
    await admin.unsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
