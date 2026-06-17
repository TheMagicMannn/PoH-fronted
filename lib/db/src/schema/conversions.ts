import { pgTable, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const conversionsTable = pgTable("conversions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  sessionId: text("session_id"),
  type: text("type").notNull().default("lead"),
  status: text("status").notNull().default("observed"),
  classification: text("classification").notNull().default("trusted"),
  value: real("value").default(0),
  source: text("source"),
  manualOverride: boolean("manual_override").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConversionSchema = createInsertSchema(conversionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversionsTable.$inferSelect;
