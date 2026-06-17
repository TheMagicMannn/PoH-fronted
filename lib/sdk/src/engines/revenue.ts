import type { HttpClient } from "../utils/http.js";
import type {
  RevenueScoreRequest,
  RevenueScoreResponse,
  RevenueFeedbackRequest,
} from "../types/revenue.js";
import type { ExplainResponse, FeedbackResponse } from "../types/common.js";

export class RevenueEngine {
  private readonly basePath = "/v1/revenue";

  constructor(private readonly http: HttpClient) {}

  async score(request: RevenueScoreRequest): Promise<RevenueScoreResponse> {
    return this.http.post<RevenueScoreResponse>(`${this.basePath}/score`, request);
  }

  async explain(scoreId: string): Promise<ExplainResponse> {
    return this.http.get<ExplainResponse>(`${this.basePath}/explain/${scoreId}`);
  }

  async feedback(request: RevenueFeedbackRequest): Promise<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.basePath}/feedback`, request);
  }
}
