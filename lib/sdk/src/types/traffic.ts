import type {
  BaseScoreResponse,
  DeviceSignal,
  GeoSignal,
  NetworkSignal,
  RiskTier,
} from "./common.js";

export type TrafficDecision =
  | "allow"
  | "allow_and_monitor"
  | "deprioritize_attribution"
  | "discount_and_review"
  | "challenge"
  | "rate_limit"
  | "quarantine"
  | "exclude_from_reports"
  | "block_source"
  | "escalate_for_review";

export type TrafficSourceType =
  | "direct"
  | "organic_search"
  | "paid_search"
  | "paid_social"
  | "organic_social"
  | "referral"
  | "email"
  | "affiliate"
  | "display"
  | "push"
  | "sms"
  | "in_app"
  | "api"
  | "partner"
  | "unknown";

export type TrafficCategory =
  | "organic_genuine"
  | "paid_genuine"
  | "high_intent_direct"
  | "low_intent_browsing"
  | "incentivized"
  | "affiliate"
  | "referral"
  | "bot"
  | "scripted"
  | "click_farm"
  | "lead_farm"
  | "fraud_ring"
  | "unknown";

export type TrafficReasonCode =
  | "source_mismatch"
  | "campaign_spike"
  | "low_engagement"
  | "conversion_too_fast"
  | "datacenter_network"
  | "referral_loop"
  | "repeat_fingerprint"
  | "geo_inconsistency"
  | "burst_pattern"
  | "suspicious_attribution"
  | "good_source_alignment"
  | "normal_engagement"
  | "consistent_geo"
  | string;

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface TrafficSourceSignal {
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  campaignId?: string;
  sourceType?: TrafficSourceType;
  landingPage?: string;
}

export interface TrafficEngagementSignal {
  timeOnPageMs?: number;
  scrollDepthPercent?: number;
  pageCount?: number;
  clickCount?: number;
  sessionDurationMs?: number;
  bounced?: boolean;
  readingPaceWordsPerMin?: number;
  interactionDiversity?: number;
}

export interface TrafficConversionSignal {
  converted?: boolean;
  conversionType?: "signup" | "lead" | "purchase" | "install" | "trial" | "activation" | "referral" | string;
  timeToConvertMs?: number;
  formCompletionSpeedMs?: number;
  fieldCorrectionCount?: number;
  duplicateSubmission?: boolean;
}

export interface TrafficScoreRequest {
  tenantId: string;
  sessionId: string;
  eventType: string;
  source?: TrafficSourceSignal;
  signals?: {
    geo?: GeoSignal;
    device?: DeviceSignal;
    network?: NetworkSignal;
    engagement?: TrafficEngagementSignal;
    conversion?: TrafficConversionSignal;
  };
}

export interface TrafficModuleScores {
  source: number;
  campaign: number;
  engagement: number;
  conversion: number;
  referral: number;
  geo: number;
  temporal: number;
  deviceNetwork: number;
}

export interface TrafficScoreResponse extends BaseScoreResponse {
  scoreId: string;
  trafficTrustScore: number;
  trafficQualityScore: number;
  sourceIntegrityScore: number;
  campaignIntegrityScore: number;
  trafficFraudScore: number;
  decision: TrafficDecision;
  sourceType: TrafficSourceType;
  trafficCategory?: TrafficCategory;
  attributionConfidence: number;
  moduleScores: TrafficModuleScores;
}

export interface TrafficFeedbackRequest {
  scoreId: string;
  outcome:
    | "confirmed_fraud"
    | "invalid_lead"
    | "genuine_conversion"
    | "campaign_review_complete"
    | "partner_abuse_confirmed"
    | "false_positive";
  notes?: string;
}
