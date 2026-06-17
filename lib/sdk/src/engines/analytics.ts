import type { HttpClient } from "../utils/http.js";
import type {
  AnalyticsHealthResponse,
  MetricsQueryParams,
  MetricsResponse,
  DashboardData,
  CreateAlertRequest,
  Alert,
  QueueType,
  ListQueueItemsResponse,
  ResolveQueueItemRequest,
  ResolveQueueItemResponse,
  GenerateReportRequest,
  GenerateReportResponse,
  ForecastRequest,
  ForecastResponse,
} from "../types/analytics.js";

export class AnalyticsEngine {
  private readonly analyticsPath = "/v1/analytics";
  private readonly operationsPath = "/v1/operations";

  constructor(private readonly http: HttpClient) {}

  async getHealth(tenantId: string): Promise<AnalyticsHealthResponse> {
    return this.http.get<AnalyticsHealthResponse>(
      `${this.analyticsPath}/health?tenantId=${encodeURIComponent(tenantId)}`,
    );
  }

  async getMetrics(params: MetricsQueryParams): Promise<MetricsResponse> {
    const qs = new URLSearchParams({
      tenantId: params.tenantId,
      startTime: params.startTime,
      endTime: params.endTime,
      ...(params.metricName ? { metricName: params.metricName } : {}),
      ...(params.granularity ? { granularity: params.granularity } : {}),
    });
    if (params.dimensions) {
      Object.entries(params.dimensions).forEach(([k, v]) => qs.set(`dim_${k}`, v));
    }
    return this.http.get<MetricsResponse>(`${this.analyticsPath}/metrics?${qs}`);
  }

  async getDashboard(dashboardId: string): Promise<DashboardData> {
    return this.http.get<DashboardData>(
      `${this.analyticsPath}/dashboard/${encodeURIComponent(dashboardId)}`,
    );
  }

  async createAlert(request: CreateAlertRequest): Promise<Alert> {
    return this.http.post<Alert>(`${this.operationsPath}/alerts`, request);
  }

  async listQueueItems(
    queueType: QueueType,
    params?: { limit?: number; offset?: number; state?: string },
  ): Promise<ListQueueItemsResponse> {
    const qs = new URLSearchParams();
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.offset !== undefined) qs.set("offset", String(params.offset));
    if (params?.state) qs.set("state", params.state);
    const query = qs.toString();
    return this.http.get<ListQueueItemsResponse>(
      `${this.operationsPath}/queues/${queueType}${query ? `?${query}` : ""}`,
    );
  }

  async resolveQueueItem(
    queueItemId: string,
    request: ResolveQueueItemRequest,
  ): Promise<ResolveQueueItemResponse> {
    return this.http.post<ResolveQueueItemResponse>(
      `${this.operationsPath}/queues/${encodeURIComponent(queueItemId)}/resolve`,
      request,
    );
  }

  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    return this.http.post<GenerateReportResponse>(`${this.analyticsPath}/reports/generate`, request);
  }

  async forecast(request: ForecastRequest): Promise<ForecastResponse> {
    return this.http.post<ForecastResponse>(`${this.analyticsPath}/forecast`, request);
  }
}
