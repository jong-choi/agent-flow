import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const aiModels = pgTable(
  "ai_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Compatibility alias for saved workflows and older API clients. Never repurpose it.
    modelId: text("model_id").notNull().unique(),
    upstreamModelId: text("upstream_model_id").notNull(),
    provider: text("provider").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    replacementModelId: uuid("replacement_model_id").references(
      (): AnyPgColumn => aiModels.id,
      { onDelete: "set null" },
    ),
    retirementAt: timestamp("retirement_at"),
    retirementReason: text("retirement_reason"),
    retirementSourceUrl: text("retirement_source_url"),
    promotionBlocked: boolean("promotion_blocked").notNull().default(false),
    requireFreeAccess: boolean("require_free_access").notNull().default(false),
    order: integer("order").notNull().default(0),
    price: integer("price"),
    isActive: boolean("is_active").notNull().default(false),
    lifecycle: text("lifecycle", {
      enum: ["candidate", "active", "deprecated", "retired"],
    })
      .notNull()
      .default("candidate"),
    entitlement: text("entitlement", {
      enum: ["unknown", "free_confirmed", "paid", "blocked"],
    })
      .notNull()
      .default("unknown"),
    health: text("health", {
      enum: ["healthy", "cooldown", "probing", "suspended"],
    })
      .notNull()
      .default("healthy"),
    contextWindow: integer("context_window"),
    // Provider-owned facts. Collector may update these, never operator fields above.
    catalogMetadata: jsonb("catalog_metadata")
      .$type<{
        inputTokenLimit?: number;
        outputTokenLimit?: number;
        version?: string;
        capabilities?: string[];
        supportedGenerationMethods?: string[];
        freeTierSourceUrl?: string;
        compatibilityCheckedAt?: string;
        sourceUrl?: string;
      }>()
      .notNull()
      .default({}),
    catalogCheckedAt: timestamp("catalog_checked_at"),
    appMaxInputTokens: integer("app_max_input_tokens").notNull().default(8000),
    appMaxOutputTokens: integer("app_max_output_tokens"),
    metadata: jsonb("metadata").$type<{
      maxOutputTokens?: number;
      thinkingLevel?: "default" | "minimal" | "low" | "medium" | "high";
      titlePriority?: number;
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_models_provider_upstream_unique").on(
      table.provider,
      table.upstreamModelId,
    ),
    check(
      "ai_models_price_nonnegative",
      sql`${table.price} is null or ${table.price} >= 0`,
    ),
    check(
      "ai_models_app_limits_positive",
      sql`${table.appMaxInputTokens} > 0 and (${table.appMaxOutputTokens} is null or ${table.appMaxOutputTokens} > 0)`,
    ),
    check(
      "ai_models_lifecycle_valid",
      sql`${table.lifecycle} in ('candidate','active','deprecated','retired')`,
    ),
    check(
      "ai_models_entitlement_valid",
      sql`${table.entitlement} in ('unknown','free_confirmed','paid','blocked')`,
    ),
    check(
      "ai_models_health_valid",
      sql`${table.health} in ('healthy','cooldown','probing','suspended')`,
    ),
  ],
);

export const aiModelExecutions = pgTable("ai_model_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelRegistryId: uuid("model_registry_id")
    .notNull()
    .references(() => aiModels.id),
  provider: text("provider").notNull(),
  upstreamModelId: text("upstream_model_id").notNull(),
  credits: integer("credits").notNull(),
  inputLimit: integer("input_limit").notNull(),
  outputLimit: integer("output_limit").notNull(),
  userId: text("user_id"),
  threadId: text("thread_id"),
  nodeId: text("node_id"),
  status: text("status", { enum: ["running", "succeeded", "failed"] })
    .notNull()
    .default("running"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
export type AiModel = typeof aiModels.$inferSelect;
export type AiModelInsert = typeof aiModels.$inferInsert;
