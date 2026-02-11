import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";
import { workflows } from "@/db/schema/workflows";

/**
 * 사용자가 발급할 수 있는 서비스용 시크릿 키.
 * - 실제 키 문자열은 DB에 저장하지 않고(secretHash만 저장) 발급 시 1회만 노출한다.
 * - 조회 화면에서는 preview만 노출한다. (예: af-4c********************)
 */
export const userSecrets = pgTable("user_secrets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  secretHash: text("secret_hash").notNull().unique(),
  preview: text("preview").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  deletedAt: timestamp("deleted_at"),
});

/**
 * 워크플로우별로 발급할 수 있는 공개 ID 키(= X-CANVAS-ID).
 * - 워크플로우와 1:1 관계
 */
export const workflowApiIds = pgTable("workflow_api_ids", {
  id: uuid("id").defaultRandom().primaryKey(),
  workflowId: uuid("workflow_id")
    .notNull()
    .unique()
    .references(() => workflows.id, { onDelete: "cascade" }),
  canvasId: text("canvas_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export type UserSecret = typeof userSecrets.$inferSelect;
export type UserSecretInsert = typeof userSecrets.$inferInsert;

export type WorkflowApiId = typeof workflowApiIds.$inferSelect;
export type WorkflowApiIdInsert = typeof workflowApiIds.$inferInsert;
