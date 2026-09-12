import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { StoredMessage } from "@langchain/core/messages";
import { aiModelExecutions } from "./ai-models";
import { creditTransactions } from "./credit";

export const aiExecutionBilling = pgTable(
  "ai_execution_billing",
  {
    executionId: uuid("execution_id")
      .primaryKey()
      .references(() => aiModelExecutions.id),
    executionKey: text("execution_key").notNull().unique(),
    status: text("status", {
      enum: ["reserved", "settled", "released"],
    }).notNull(),
    result: jsonb("result").$type<StoredMessage[]>(),
    transactionId: uuid("transaction_id")
      .unique()
      .references(() => creditTransactions.id),
    expiresAt: timestamp("expires_at").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    check(
      "ai_execution_billing_status_check",
      sql`${table.status} in ('reserved','settled','released')`,
    ),
    index("ai_execution_billing_expiry")
      .on(table.expiresAt)
      .where(sql`${table.status}='reserved'`),
  ],
);
