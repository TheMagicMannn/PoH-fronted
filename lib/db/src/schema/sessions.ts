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
  // Human Authenticity Engine
  humanScore: real("human_score"),
  humanConfidence: real("human_confidence"),
  humanClassification: text("human_classification"),
  humanDecision: text("human_decision"),
  browserIntegrityScore: real("browser_integrity_score"),
  behaviorScore: real("behavior_score"),
  deviceConsistencyScore: real("device_consistency_score"),
  networkScore: real("network_score"),
  historicalScore: real("historical_score"),
  // Traffic Intelligence Engine (TIEg)
  trafficTrustScore: real("traffic_trust_score"),
  trafficQualityScore: real("traffic_quality_score"),
  trafficFraudScore: real("traffic_fraud_score"),
  trafficConfidence: real("traffic_confidence"),
  trafficRiskTier: text("traffic_risk_tier"),
  trafficDecision: text("traffic_decision"),
  trafficSourceScore: real("traffic_source_score"),
  trafficCampaignScore: real("traffic_campaign_score"),
  trafficEngagementScore: real("traffic_engagement_score"),
  trafficConversionScore: real("traffic_conversion_score"),
  trafficReferralScore: real("traffic_referral_score"),
  trafficGeoScore: real("traffic_geo_score"),
  trafficTemporalScore: real("traffic_temporal_score"),
  trafficDeviceNetworkScore: real("traffic_device_network_score"),
  // Revenue Protection Engine
  revenueProtectionScore: real("revenue_protection_score"),
  chargebackRiskScore: real("chargeback_risk_score"),
  refundAbuseScore: real("refund_abuse_score"),
  promoAbuseScore: real("promo_abuse_score"),
  billingAnomalyScore: real("billing_anomaly_score"),
  revenueDecision: text("revenue_decision"),
  revenueRiskTier: text("revenue_risk_tier"),
  sessionIntegrityScore: real("session_integrity_score"),
  networkTrustScore: real("network_trust_score"),
  revenueTrafficQualityScore: real("revenue_traffic_quality_score"),
  behavioralFinancialScore: real("behavioral_financial_score"),
  identitySignalsScore: real("identity_signals_score"),
  revenueReasonCodes: jsonb("revenue_reason_codes").$type<string[]>().default([]),
  // Device Intelligence Engine
  deviceIntelScore: real("device_intel_score"),
  deviceVelocityScore: real("device_velocity_score"),
  deviceFraudRateScore: real("device_fraud_rate_score"),
  deviceSpreadScore: real("device_spread_score"),
  deviceRecurrenceScore: real("device_recurrence_score"),
  deviceRiskTier: text("device_risk_tier"),
  deviceSessionCount: integer("device_session_count"),
  deviceReasonCodes: jsonb("device_reason_codes").$type<string[]>().default([]),
  // Trust Intelligence Engine (TIE) — composite 0-1000 scorer
  tieTrustScore: real("tie_trust_score"),          // 0–1000 composite trust score
  tieHumanScore: real("tie_human_score"),          // 0–100 human module (20%)
  tieBehaviorScore: real("tie_behavior_score"),    // 0–100 behavioral module (15%)
  tieDeviceScore: real("tie_device_score"),        // 0–100 device module (15%)
  tieNetworkScore: real("tie_network_score"),      // 0–100 network module (10%)
  tieIdentityScore: real("tie_identity_score"),    // 0–100 identity module (10%)
  tieTrafficScore: real("tie_traffic_score"),      // 0–100 traffic module (10%)
  tieGraphScore: real("tie_graph_score"),          // 0–100 graph/relationship module (10%)
  tieFraudInverseScore: real("tie_fraud_inverse_score"), // 0–100 fraud inverse (10%)
  tieFraudScore: real("tie_fraud_score"),          // 0–100 fraud probability
  tieConfidence: real("tie_confidence"),           // 0–1
  tieRiskTier: text("tie_risk_tier"),
  tieDecision: text("tie_decision"),
  tieReasonCodes: jsonb("tie_reason_codes").$type<string[]>().default([]),
  tiePositiveSignals: jsonb("tie_positive_signals").$type<string[]>().default([]),
  tieNegativeSignals: jsonb("tie_negative_signals").$type<string[]>().default([]),
  //
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
