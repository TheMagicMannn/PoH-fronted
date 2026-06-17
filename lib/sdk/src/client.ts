import { HttpClient, type HttpClientConfig } from "./utils/http.js";
import { HumanEngine } from "./engines/human.js";
import { TrafficEngine } from "./engines/traffic.js";
import { RevenueEngine } from "./engines/revenue.js";
import { AnalyticsEngine } from "./engines/analytics.js";
import { BehaviorCollector } from "./collectors/behavior.js";
import {
  collectDeviceSignals,
  detectHeadlessIndicators,
} from "./utils/fingerprint.js";
import type { DeviceSignal, BehaviorSignal } from "./types/common.js";
import type {
  HumanAnalyzeRequest,
  HumanAnalyzeResponse,
} from "./types/human.js";
import type {
  TrafficScoreRequest,
  TrafficScoreResponse,
} from "./types/traffic.js";

export interface PoHClientConfig {
  baseUrl: string;
  apiKey?: string;
  siteId?: string;
  tenantId?: string;
  timeout?: number;
  collectBehavior?: boolean;
  headers?: Record<string, string>;
  onError?: (url: string, error: unknown) => void;
}

export class PoHClient {
  readonly human: HumanEngine;
  readonly traffic: TrafficEngine;
  readonly revenue: RevenueEngine;
  readonly analytics: AnalyticsEngine;

  private readonly http: HttpClient;
  private readonly config: PoHClientConfig;
  private readonly behaviorCollector: BehaviorCollector;

  constructor(config: PoHClientConfig) {
    this.config = config;

    const httpConfig: HttpClientConfig = {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeout: config.timeout ?? 15_000,
      headers: config.headers,
      onError: config.onError,
    };

    this.http = new HttpClient(httpConfig);
    this.human = new HumanEngine(this.http);
    this.traffic = new TrafficEngine(this.http);
    this.revenue = new RevenueEngine(this.http);
    this.analytics = new AnalyticsEngine(this.http);
    this.behaviorCollector = new BehaviorCollector();

    if (config.collectBehavior !== false && typeof document !== "undefined") {
      this.behaviorCollector.attach();
    }
  }

  async collectSignals(): Promise<{
    device: DeviceSignal;
    behavior: BehaviorSignal;
    browserIntegrity: ReturnType<typeof detectHeadlessIndicators>;
  }> {
    const [device, browserIntegrity] = await Promise.all([
      collectDeviceSignals(),
      Promise.resolve(detectHeadlessIndicators()),
    ]);
    const behavior = this.behaviorCollector.collect();
    return { device, behavior, browserIntegrity };
  }

  async analyzeHuman(
    sessionId: string,
    options?: Partial<Omit<HumanAnalyzeRequest, "siteId" | "sessionId">>,
  ): Promise<HumanAnalyzeResponse> {
    const { device, behavior, browserIntegrity } = await this.collectSignals();

    const request: HumanAnalyzeRequest = {
      siteId: this.config.siteId ?? "unknown",
      sessionId,
      ...options,
      signals: {
        device,
        behavior,
        browserIntegrity: {
          headlessProbability: browserIntegrity.headlessProbability,
          webdriverPresent: browserIntegrity.webdriverPresent,
          navigatorAnomalyScore: browserIntegrity.navigatorAnomalies.length * 10,
        },
        ...options?.signals,
      },
    };

    return this.human.analyze(request);
  }

  async scoreTraffic(
    sessionId: string,
    options?: Partial<Omit<TrafficScoreRequest, "tenantId" | "sessionId">>,
  ): Promise<TrafficScoreResponse> {
    const { device } = await this.collectSignals();

    const request: TrafficScoreRequest = {
      tenantId: this.config.tenantId ?? "unknown",
      sessionId,
      eventType: options?.eventType ?? "page_view",
      ...options,
      signals: {
        device,
        ...options?.signals,
      },
    };

    return this.traffic.score(request);
  }

  resetBehavior(): void {
    this.behaviorCollector.reset();
  }

  destroy(): void {
    this.behaviorCollector.detach();
  }
}
