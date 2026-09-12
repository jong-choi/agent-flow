import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { z } from "zod";
import {
  listModelRegistry,
  updateModelSettings,
  upsertCatalogModel,
} from "../src/lib/ai/registry-store";

async function main() {
  const [command, argument, file] = process.argv.slice(2);
  if (
    command !== "list" &&
    new URL(process.env.DATABASE_URL!).hostname !== "127.0.0.1"
  )
    throw new Error(
      "Writes are limited to the local development DB in this phase",
    );
  if (
    command === "migrate" ||
    command === "history-migrate" ||
    command === "maintenance-migrate"
  ) {
    if (argument !== "up" && argument !== "down")
      throw new Error("Use migrate up|down");
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      onnotice: () => {},
    });
    try {
      await client.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(21465, 2)`;
        await tx.unsafe(
          await readFile(
            `migrations/${command === "history-migrate" ? "provider-history" : command === "maintenance-migrate" ? "model-maintenance" : "model-registry"}/001-${argument}.sql`,
            "utf8",
          ),
        );
      });
    } finally {
      await client.end();
    }
    console.log(`Registry migration ${argument} applied`);
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await listModelRegistry(), null, 2));
    return;
  }
  if (command === "update") {
    const id = z.uuid().parse(argument);
    const settings = z
      .object({
        name: z.string().trim().min(1).optional(),
        description: z.string().nullable().optional(),
        price: z.number().int().min(0).nullable().optional(),
        order: z.number().int().optional(),
        isActive: z.boolean().optional(),
        metadata: z
          .object({
            maxOutputTokens: z.number().int().positive().optional(),
            thinkingLevel: z
              .enum(["default", "minimal", "low", "medium", "high"])
              .optional(),
            titlePriority: z.number().int().nonnegative().optional(),
          })
          .strict()
          .nullable()
          .optional(),
        appMaxInputTokens: z.number().int().positive().optional(),
        appMaxOutputTokens: z.number().int().positive().nullable().optional(),
      })
      .strict()
      .parse(JSON.parse(await readFile(file, "utf8")));
    console.log(
      JSON.stringify(await updateModelSettings(id, settings), null, 2),
    );
    return;
  }
  if (command === "catalog") {
    const models = z
      .array(
        z
          .object({
            provider: z.string().min(1),
            upstreamModelId: z.string().min(1),
            displayName: z.string().min(1),
            contextWindow: z.number().int().positive().nullable().optional(),
            metadata: z
              .object({
                inputTokenLimit: z.number().int().positive().optional(),
                outputTokenLimit: z.number().int().positive().optional(),
                version: z.string().optional(),
                capabilities: z.array(z.string()).optional(),
                sourceUrl: z.url().optional(),
              })
              .strict(),
          })
          .strict(),
      )
      .parse(JSON.parse(await readFile(argument, "utf8")));
    for (const model of models)
      console.log((await upsertCatalogModel(model)).id);
    return;
  }
  throw new Error(
    "Usage: models list | migrate up|down | update <UUID> <settings.json> | catalog <catalog.json>",
  );
}
void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Registry command failed",
    );
    process.exit(1);
  });
