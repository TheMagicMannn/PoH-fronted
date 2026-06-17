import type { AlertSeverity } from "./common.js";

export type AnalyticsDecision =
  | "monitor"
  | "investigate"
  | "escalate"
  | "notify"
  | "create_incident"
  | "backfill_data"
  | "reprocess_pipeline"
  | "pause_campaign"
  | "prioritize_queue"
  | "trigger_executive_review"
  | "publish_report";

export type MetricGranularity = "minute" | "hour" | "day" | "week" | "month";

export type QueueType =
  | "manual_review"
  | "fraud_investigation"
  | "support_escalation"
  | "billing_escalation"
  | "data_quality"
  | "tenant_onboarding";

export type QueueItemState =
  | "pending"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed";

export type ReportFormat = "json" | "csv" | "pdf";

export type ReportType =
  | "daily_summary"
  | "weekly_executive"
  | "monthly_review"
  | "tenant_report"
  | "trust_performance"
  | "fraud_detection"
  | "traffic_quality"
  | "revenue_health";

export type AnalyticsReasonCode =
  | "latency_regression"
  | "error_spike"
  | "fraud_burst"
  | "traffic_anomaly"
  | "revenue_drop"
  | "backlog_growth"
  | "forecast_deviation"
  | "tenant_usage_decline"
  | "model_drift"
  | "data_freshness_issue"
  | string;

export interface AnalyticsModuleScores {
  platform: number;
  product: number;
  trust: number;
  traffic: number;
  revenue: number;
  operations: number;
  customerSuccess: number;
  executive: number;
  forecasting: number;
}

export interface AnalyticsHealthResponse {
  analyticsHealthScore: number;
  operationalHealthScore: number;
  businessPerformanceScore: number;
  insightConfidence: number;
  alertSeverity: AlertSeverity;
  decision: AnalyticsDecision;
  moduleScores: AnalyticsModuleScores;
  reasonCodes: AnalyticsReasonCode[];
  topSignals: {
    positive: string[];
    negative: string[];
  };
  modelVersion: string;
}

export interface MetricsQueryParams {
  tenantId: string;
  metricName?: string;
  startTime: string;
  endTime: string;
  granularity?: MetricGranularity;
  dimensions?: Record<string, string>;
}

export interface Metric {
  metricId: string;
  tenantId: string;
  metricName: string;
  metricValue: number;
  timestamp: string;
  dimensions?: Record<string, string>;
  sourceSystem?: string;
  granularity?: MetricGranularity;
}

export interface MetricsResponse {
  metrics: Metric[];
  total: number;
  granularity: MetricGranularity;
  startTime: string;
  endTime: string;
}

export interface DashboardData {
  dashboardId: string;
  tenantId: string;
  name: string;
  audience: string;
  widgets: DashboardWidget[];
  filters?: Record<string, unknown>;
  version: string;
  refreshedAt: string;
}

export interface DashboardWidget {
  widgetId: string;
  type: string;
  title: string;
  data: unknown;
  metricName?: string;
  dimensions?: Record<string, string>;
}

export interface CreateAlertRequest {
  tenantId: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  description?: string;
  owner?: string;
  slaDurationMs?: number;
  escalationPath?: string[];
  linkedMetrics?: string[];
  evidencePayload?: Record<string, unknown>;
  suggestedResponse?: string;
}

export interface Alert {
  alertId: string;
  tenantId: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  description?: string;
  status: "open" | "acknowledged" | "resolved" | "escalated";
  triggeredAt: string;
  resolvedAt?: string;
  owner?: string;
  reasonCodes?: string[];
}

export interface QueueItem {
  queueItemId: string;
  tenantId: string;
  queueType: QueueType;
  priority: number;
  state: QueueItemState;
  assignedTo?: string;
  dueAt?: string;
  evidencePayload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListQueueItemsResponse {
  items: QueueItem[];
  total: number;
  queueType: QueueType;
}

export interface ResolveQueueItemRequest {
  resolution: string;
  outcome: string;
  notes?: string;
  resolvedBy?: string;
}

export interface ResolveQueueItemResponse {
  queueItemId: string;
  state: "resolved";
  resolvedAt: string;
}

export interface GenerateReportRequest {
  tenantId: string;
  reportType: ReportType;
  format?: ReportFormat;
  startTime?: string;
  endTime?: string;
  recipients?: string[];
  filters?: Record<string, unknown>;
}

export interface GenerateReportResponse {
  reportId: string;
  tenantId: string;
  reportType: ReportType;
  status: "queued" | "generating" | "complete" | "failed";
  format: ReportFormat;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ForecastRequest {
  tenantId: string;
  metricName: string;
  horizonDays: number;
  includeConfidenceInterval?: boolean;
}

export interface ForecastDataPoint {
  timestamp: string;
  predictedValue: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface ForecastResponse {
  forecastId: string;
  metricName: string;
  horizon: number;
  dataPoints: ForecastDataPoint[];
  confidenceInterval?: number;
  modelVersion: string;
  generatedAt: string;
}
