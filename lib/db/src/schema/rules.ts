import { pgTable, text, boolean, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rulesTable = pgTable("rules", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(true),
  conditions: jsonb("conditions").$type<unknown[]>().default([]),
  action: text("action").notNull().default("observe"),
  priority: integer("priority").notNull().default(0),
  hits: integer("hits").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRuleSchema = createInsertSchema(rulesTable).omit({ createdAt: true });
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rulesTable.$inferSelect;
