import type { HttpClient } from "../utils/http.js";
import type {
  HumanAnalyzeRequest,
  HumanAnalyzeResponse,
  HumanFeedbackRequest,
} from "../types/human.js";
import type { ExplainResponse, FeedbackResponse } from "../types/common.js";

export class HumanEngine {
  private readonly basePath = "/v1/human";

  constructor(private readonly http: HttpClient) {}

  async analyze(request: HumanAnalyzeRequest): Promise<HumanAnalyzeResponse> {
    return this.http.post<HumanAnalyzeResponse>(`${this.basePath}/analyze`, request);
  }

  async explain(assessmentId: string): Promise<ExplainResponse> {
    return this.http.get<ExplainResponse>(`${this.basePath}/explain/${assessmentId}`);
  }

  async feedback(request: HumanFeedbackRequest): Promise<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${this.basePath}/feedback`, request);
  }
}
