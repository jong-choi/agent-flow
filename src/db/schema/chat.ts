import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/db/schema/auth";
import { workflows } from "@/db/schema/workflows";

export const chatMessageRole = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
]);

/**
 * chats.id는 checkpointer의 checkpoints.thread_id로 전달된다.
 * (thread_id ↔ chatId 1:1 매핑)
 */
export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

/**
 * LangGraph streamEvents 실행이 끝난 뒤 DB에 메시지 목록을 저장한다.
 */
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: chatMessageRole("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Chat = typeof chats.$inferSelect;
export type ChatInsert = typeof chats.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatMessageInsert = typeof chatMessages.$inferInsert;
