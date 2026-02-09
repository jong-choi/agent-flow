import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const aiModels = pgTable("ai_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: text("model_id").notNull().unique(), // 'gemma-3-1b-it', 'gemma-3-4b-it', 'gemma-3-12b-it', 'gemma-3-27b-it'
  name: text("name").notNull(), // 'Gemma 3 (3B)'
  order: integer("order").notNull().default(0),
  provider: text("provider").notNull(), // 'google', 'anthropic' 등
  contextWindow: integer("context_window"), // 8192 등
  price: integer("price"), // 1크레딧, 10크레딧 등
  isActive: boolean("is_active").notNull().default(true),
  metadata: jsonb("metadata").$type<{
    maxOutputTokens?: number;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AiModel = typeof aiModels.$inferSelect;
export type AiModelInsert = typeof aiModels.$inferInsert;
