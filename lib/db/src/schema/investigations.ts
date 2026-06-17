import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investigationsTable = pgTable("investigations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  assignee: text("assignee"),
  clusterId: text("cluster_id"),
  notes: jsonb("notes").$type<Array<{ author: string; text: string; at: string }>>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvestigationSchema = createInsertSchema(investigationsTable).omit({ createdAt: true });
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;
export type Investigation = typeof investigationsTable.$inferSelect;
