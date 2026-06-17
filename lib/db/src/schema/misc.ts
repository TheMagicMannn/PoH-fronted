import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogsTable = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userName: text("user_name"),
  action: text("action").notNull(),
  target: text("target"),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fraudClustersTable = pgTable("fraud_clusters", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  fingerprintHash: text("fingerprint_hash"),
  classification: text("classification").notNull().default("fraudulent"),
  sessionCount: text("session_count").notNull().default("0"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ createdAt: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertFraudClusterSchema = createInsertSchema(fraudClustersTable).omit({ createdAt: true });
export type InsertFraudCluster = z.infer<typeof insertFraudClusterSchema>;
