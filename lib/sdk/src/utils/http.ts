export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
  onRequest?: (url: string, options: RequestInit) => void;
  onResponse?: (url: string, response: Response) => void;
  onError?: (url: string, error: unknown) => void;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    public readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} — ${url}`);
    this.name = "HttpError";
  }
}

export class HttpClient {
  private config: Required<Pick<HttpClientConfig, "baseUrl" | "timeout">> &
    Omit<HttpClientConfig, "baseUrl" | "timeout">;

  constructor(config: HttpClientConfig) {
    this.config = {
      timeout: 30_000,
      ...config,
    };
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {}, signal, timeout } = options;

    const url = `${this.config.baseUrl}${path}`;

    const mergedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
      ...headers,
    };

    if (this.config.apiKey) {
      mergedHeaders["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const requestInit: RequestInit = {
      method,
      headers: mergedHeaders,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    const effectiveTimeout = timeout ?? this.config.timeout;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let abortController: AbortController | undefined;

    if (!signal && effectiveTimeout > 0) {
      abortController = new AbortController();
      timeoutId = setTimeout(() => abortController!.abort(), effectiveTimeout);
      requestInit.signal = abortController.signal;
    } else if (signal) {
      requestInit.signal = signal;
    }

    this.config.onRequest?.(url, requestInit);

    try {
      const response = await fetch(url, requestInit);
      this.config.onResponse?.(url, response);

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }
        throw new HttpError(response.status, response.statusText, errorBody, url);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      this.config.onError?.(url, err);
      throw err;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
}
