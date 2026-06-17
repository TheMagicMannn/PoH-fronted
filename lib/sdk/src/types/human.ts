import type {
  BaseScoreResponse,
  BehaviorSignal,
  DeviceSignal,
  NetworkSignal,
} from "./common.js";

export type HumanClassification =
  | "human"
  | "suspicious_human"
  | "automation"
  | "bot"
  | "emulator"
  | "uncertain";

export type HumanDecision = "allow" | "challenge" | "step_up" | "block";

export type HumanReasonCode =
  | "headless_browser_detected"
  | "webdriver_detected"
  | "automation_framework_signature"
  | "cursor_entropy_low"
  | "typing_pattern_nonhuman"
  | "scroll_cadence_suspicious"
  | "device_fingerprint_drift"
  | "inconsistent_timezone"
  | "ip_datacenter_risk"
  | "vpn_probability_high"
  | "proxy_cluster_match"
  | "historical_human_match"
  | "consistent_device_behavior"
  | "natural_session_rhythm"
  | "low_signal_confidence"
  | string;

export interface HumanBrowserIntegritySignals {
  headlessProbability?: number;
  webdriverPresent?: boolean;
  browserApiInconsistencyScore?: number;
  navigatorAnomalyScore?: number;
  permissionAnomalyScore?: number;
  prototypeTamperingScore?: number;
  extensionTamperScore?: number;
  syntheticDomEventScore?: number;
  automationFrameworkSignatureScore?: number;
  devtoolsTriggerScore?: number;
}

export interface HumanDeviceConsistencySignals {
  deviceStabilityScore?: number;
  deviceReuseScore?: number;
  browserVersionConsistency?: number;
  localeConsistency?: number;
  timezoneConsistency?: number;
  screenConsistency?: number;
  hardwareConsistency?: number;
  fingerprintDriftScore?: number;
  deviceChangeVelocity?: number;
}

export interface HumanHistoricalSignals {
  priorHumanConfirmations?: number;
  priorChallengesPassed?: number;
  priorBlocks?: number;
  priorFraudFlags?: number;
  timeSinceLastSeenMs?: number;
  accountAgeMs?: number;
  visitorReputationScore?: number;
  siteHistoryAlignment?: number;
}

export interface HumanAnalyzeContext {
  eventName?: string;
  url?: string;
  referrer?: string;
  actionType?: "signup" | "login" | "checkout" | "lead_submit" | "password_reset" | "high_value" | string;
}

export interface HumanAnalyzeRequest {
  siteId: string;
  sessionId: string;
  visitorId?: string;
  userId?: string;
  context?: HumanAnalyzeContext;
  signals?: {
    device?: DeviceSignal;
    behavior?: BehaviorSignal;
    network?: NetworkSignal;
    browserIntegrity?: HumanBrowserIntegritySignals;
    deviceConsistency?: HumanDeviceConsistencySignals;
    history?: HumanHistoricalSignals;
  };
}

export interface HumanScoreDetail {
  score: number;
  confidence: number;
  level: RiskLevel;
}

type RiskLevel = "low" | "medium" | "high";

export interface HumanAnalyzeResponse extends BaseScoreResponse {
  requestId: string;
  sessionId: string;
  scores: {
    human: HumanScoreDetail;
    browserIntegrity?: number;
    humanBehavior?: number;
    deviceConsistency?: number;
    networkReputation?: number;
    historicalAuthenticity?: number;
  };
  classification: HumanClassification;
  decision: HumanDecision;
  reasons: HumanReasonCode[];
  expiresAt?: string;
}

export interface HumanFeedbackRequest {
  assessmentId: string;
  feedbackType:
    | "confirmed_human"
    | "confirmed_automation"
    | "challenge_passed"
    | "challenge_failed"
    | "manual_override"
    | "false_positive"
    | "false_negative";
  notes?: string;
  reviewedBy?: string;
}
