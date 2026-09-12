import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { HealthState } from "@/lib/ai/maintenance/policy";
import { aiModels } from "./ai-models";

export const modelHealth = pgTable("ai_model_health", {
  modelId: uuid("model_id")
    .primaryKey()
    .references(() => aiModels.id, { onDelete: "cascade" }),
  state: jsonb("state").$type<HealthState>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const providerHealth = pgTable("ai_provider_health", {
  provider: text("provider").primaryKey(),
  credentialVersion: text("credential_version").notNull(),
  state: jsonb("state").$type<HealthState>().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const modelChecks = pgTable("ai_model_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: uuid("model_id").references(() => aiModels.id, {
    onDelete: "set null",
  }),
  provider: text("provider").notNull(),
  source: text("source").notNull(),
  ok: integer("ok").notNull(),
  scope: text("scope").notNull().default("provider"),
  category: text("category"),
  code: text("code"),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});
export const catalogRuns = pgTable("ai_catalog_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull(),
  accepted: integer("accepted").notNull(),
  reason: text("reason"),
  modelIds: jsonb("model_ids").$type<string[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const maintenanceJobs = pgTable("ai_maintenance_jobs", {
  key: text("key").primaryKey(),
  nextRunAt: timestamp("next_run_at").notNull(),
  leaseOwner: text("lease_owner"),
  leaseUntil: timestamp("lease_until"),
  lastFinishedAt: timestamp("last_finished_at"),
  lastError: text("last_error"),
});
export const probeBudgets = pgTable(
  "ai_probe_budgets",
  {
    provider: text("provider").notNull(),
    day: text("day").notNull(),
    used: integer("used").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.provider, t.day] })],
);
export const freeAccessPolicies = pgTable("ai_free_access_policies", {
  provider: text("provider").primaryKey(),
  credentialVersion: text("credential_version").notNull(),
  modelIds: jsonb("model_ids").$type<string[]>().notNull(),
  sourceUrl: text("source_url").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at").notNull().defaultNow(),
});
export const maintenanceEvents = pgTable("ai_maintenance_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(),
  provider: text("provider"),
  modelId: uuid("model_id"),
  details: jsonb("details").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const noticeSnapshots = pgTable("ai_notice_snapshots", {
  provider: text("provider").primaryKey(),
  digest: text("digest").notNull(),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});
