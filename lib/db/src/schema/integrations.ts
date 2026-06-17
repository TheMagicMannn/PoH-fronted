import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const integrationsTable = pgTable("integrations", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("disconnected"),
  connectedAt: timestamp("connected_at", { withTimezone: true }),
  lastSync: timestamp("last_sync", { withTimezone: true }),
  metric: text("metric"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrationsTable).omit({ createdAt: true });
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrationsTable.$inferSelect;
