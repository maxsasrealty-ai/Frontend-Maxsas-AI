import { ApiEnvelope } from "../../shared/contracts";
import { getCurrentTenantId } from "../auth/session";
import { clearTokens, getAccessToken, refreshAccessToken } from "../auth/tokens";
import { resolveApiBaseUrl } from "./base-url";

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  getTenantId?: () => Promise<string | null> | string | null;
  timeoutMs?: number;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: ApiClientConfig["getAuthToken"];
  private readonly getTenantId?: ApiClientConfig["getTenantId"];
  private readonly timeoutMs: number;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getAuthToken = config.getAuthToken;
    this.getTenantId = config.getTenantId;
    this.timeoutMs = config.timeoutMs ?? 15000;
  }

  async get<TResponse>(path: string, headers?: HeadersInit): Promise<ApiEnvelope<TResponse>> {
    return this.request<TResponse>(path, { method: "GET", headers });
  }

  async post<TRequest, TResponse>(
    path: string,
    body: TRequest,
    headers?: HeadersInit,
    options?: { timeoutMs?: number }
  ): Promise<ApiEnvelope<TResponse>> {
    return this.request<TResponse>(
      path,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers,
      },
      options
    );
  }

  async patch<TRequest, TResponse>(
    path: string,
    body: TRequest,
    headers?: HeadersInit,
    options?: { timeoutMs?: number }
  ): Promise<ApiEnvelope<TResponse>> {
    return this.request<TResponse>(
      path,
      {
        method: "PATCH",
        body: JSON.stringify(body),
        headers,
      },
      options
    );
  }

  private async request<TResponse>(
    path: string,
    init: RequestInit,
    options?: { timeoutMs?: number }
  ): Promise<ApiEnvelope<TResponse>> {
    if (!this.baseUrl) {
      throw new Error(
        "API base URL is not configured for this build. Set EXPO_PUBLIC_API_BASE_URL to the backend host before deploying."
      );
    }

    let token = await this.resolveToken();
    const tenantId = await this.resolveTenantId();

    let response: Response;
    const effectiveTimeout = options?.timeoutMs ?? this.timeoutMs;
    let controller: AbortController | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (effectiveTimeout > 0) {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller!.abort(), effectiveTimeout);
    }

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        ...(controller ? { signal: controller.signal } : {}),
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { "x-tenant-id": tenantId } : {}),
          ...(init.headers || {}),
        },
      });
    } catch (error) {
      return {
        success: false,
        error: {
          code: error instanceof DOMException && error.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
          message:
            error instanceof DOMException && error.name === "AbortError"
              ? "Request timed out. Please try again."
              : error instanceof Error
                ? error.message
                : "Unable to reach the server.",
        },
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    // If unauthorized, attempt a token refresh and retry once.
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = await this.resolveToken();
        try {
          response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            ...(controller ? { signal: controller.signal } : {}),
            cache: "no-store",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(tenantId ? { "x-tenant-id": tenantId } : {}),
              ...(init.headers || {}),
            },
          });
        } catch (error) {
          return {
            success: false,
            error: {
              code: "NETWORK_ERROR",
              message: error instanceof Error ? error.message : "Unable to reach the server.",
            },
          };
        }
      } else {
        // Refresh failed: clear tokens so app can sign-out.
        await clearTokens();
      }
    }

    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const looksJson = contentType.includes("application/json");

    if (rawBody.trim().length > 0) {
      try {
        const parsed = JSON.parse(rawBody) as ApiEnvelope<TResponse>;
        if (parsed && typeof parsed === "object" && "success" in parsed) {
          return parsed;
        }
      } catch {
        // Fall through to standardized error envelope for non-JSON or malformed JSON.
      }
    }

    const fallbackCode = response.ok ? "INVALID_RESPONSE" : `HTTP_${response.status}`;
    const fallbackMessage =
      response.status === 405
        ? "API route exists but does not allow this method. Verify your backend deployment and route mapping."
        : response.ok
          ? "Server returned an unexpected response format."
          : `Request failed with status ${response.status}.`;

    return {
      success: false,
      error: {
        code: fallbackCode,
        message: fallbackMessage,
        details: {
          path,
          status: response.status,
          statusText: response.statusText,
          contentType,
          bodyPreview: rawBody.slice(0, 300),
          expectedJson: looksJson,
        },
      },
    };
  }

  private async resolveToken(): Promise<string | null> {
    if (!this.getAuthToken) {
      return null;
    }

    const token = this.getAuthToken();
    return token instanceof Promise ? token : token;
  }

  private async resolveTenantId(): Promise<string | null> {
    if (!this.getTenantId) {
      return null;
    }

    const tenantId = this.getTenantId();
    return tenantId instanceof Promise ? tenantId : tenantId;
  }
}

const defaultApiBaseUrl = resolveApiBaseUrl();
const defaultTenantId = __DEV__ ? process.env.EXPO_PUBLIC_TENANT_ID || null : null;
const defaultAuthToken = __DEV__ ? process.env.EXPO_PUBLIC_AUTH_BEARER_TOKEN || "dev_token" : process.env.EXPO_PUBLIC_AUTH_BEARER_TOKEN?.trim() || null;

export const apiClient = new ApiClient({
  baseUrl: defaultApiBaseUrl,
  getTenantId: async () => {
    const tenantId = await getCurrentTenantId();
    return tenantId || defaultTenantId;
  },
  getAuthToken: async () => {
    const token = await getAccessToken();
    return token || defaultAuthToken;
  },
});
