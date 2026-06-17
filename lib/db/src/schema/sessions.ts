import { pgTable, text, real, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  sessionId: text("session_id").notNull(),
  fingerprintHash: text("fingerprint_hash"),
  ip: text("ip"),
  country: text("country"),
  city: text("city"),
  timezone: text("timezone"),
  source: text("source").notNull().default("direct"),
  medium: text("medium"),
  campaign: text("campaign"),
  adSet: text("ad_set"),
  deviceType: text("device_type"),
  os: text("os"),
  browser: text("browser"),
  ua: text("ua"),
  siteId: text("site_id"),
  landingPage: text("landing_page"),
  classification: text("classification").notNull().default("trusted"),
  fraudScore: real("fraud_score").notNull().default(0),
  trustScore: real("trust_score").notNull().default(100),
  confidence: real("confidence").notNull().default(0.9),
  action: text("action").notNull().default("observe"),
  manualOverride: boolean("manual_override").default(false),
  reasonCodes: jsonb("reason_codes").$type<string[]>().default([]),
  cost: real("cost").default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
