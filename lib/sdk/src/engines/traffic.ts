import type { HttpClient } from "../utils/http.js";
import type {
  TrafficScoreRequest,
  TrafficScoreResponse,
  TrafficFeedbackRequest,
} from "../types/traffic.js";
import type { ExplainResponse, FeedbackResponse } from "../types/common.js";

export class TrafficEngine {
  private readonly basePath = "/v1/traffic";

  constructor(private readonly http: HttpClient) {}

  async score(request: TrafficScoreRequest): Promise<TrafficScoreResponse> {
    return this.http.post<TrafficScoreResponse>(`${this.basePath}/score`, request);
  }

  async explain(scoreId: string): Promise<ExplainResponse> {
    return this.http.get<ExplainResponse>(`${this.basePath}/explain/${scoreId}`);
  }

  async feedback(request: TrafficFeedbackRequest): Promise<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.basePath}/feedback`, request);
  }
}
