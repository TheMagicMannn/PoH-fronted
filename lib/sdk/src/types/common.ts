export type RiskTier = "low" | "medium" | "elevated" | "high" | "critical";

export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface TopSignals {
  positive: string[];
  negative: string[];
}

export interface BaseScoreResponse {
  confidence: number;
  riskTier: RiskTier;
  reasonCodes: string[];
  topSignals: TopSignals;
  modelVersion: string;
  policyVersion?: string;
}

export interface FeedbackRequest {
  scoreId: string;
  outcome: string;
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface FeedbackResponse {
  accepted: boolean;
  feedbackId: string;
}

export interface ExplainResponse {
  scoreId: string;
  featureContributions: FeatureContribution[];
  reasonCodes: string[];
  policyTriggers?: string[];
  thresholdsUsed?: Record<string, number>;
  moduleBreakdown?: Record<string, number>;
}

export interface FeatureContribution {
  featureName: string;
  featureGroup: string;
  value: number;
  contribution: number;
  direction: "positive" | "negative" | "neutral";
}

export interface GeoSignal {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface DeviceSignal {
  userAgent?: string;
  os?: string;
  browser?: string;
  screenWidth?: number;
  screenHeight?: number;
  pixelRatio?: number;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport?: boolean;
  language?: string;
  languages?: string[];
  timezone?: string;
  colorDepth?: number;
  cookiesEnabled?: boolean;
  doNotTrack?: string | null;
  deviceId?: string;
}

export interface NetworkSignal {
  ip?: string;
  asn?: string;
  isp?: string;
  isProxy?: boolean;
  isVpn?: boolean;
  isTor?: boolean;
  isDatacenter?: boolean;
  connectionType?: string;
}

export interface BehaviorSignal {
  mouseEventCount?: number;
  keyEventCount?: number;
  scrollEventCount?: number;
  clickCount?: number;
  formInteractionCount?: number;
  sessionDurationMs?: number;
  firstInteractionMs?: number;
  mouseMoveEntropy?: number;
  scrollDepthPercent?: number;
  typingCadenceMs?: number[];
  pasteCount?: number;
  idlePeriodsCount?: number;
}
