// lib/api.ts
import { router } from "expo-router";
import { getToken, logout } from "./auth";
import { API_URL } from "./config";

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Plain JSON calls (dashboard, plots, alerts, ...) should fail fast enough
// that a genuinely stalled request doesn't strand the user; 15s is generous
// for these small payloads even on slow WiFi. FormData calls (photo/avatar
// upload) carry a multi-MB body, so they get a longer default — 60s covers
// a ~quality-0.7 compressed photo even on a poor connection without leaving
// the user stuck indefinitely. Either can be overridden per call.
const DEFAULT_TIMEOUT_MS = 15000;
const UPLOAD_TIMEOUT_MS = 60000;

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** If true, won't auto-attach the auth token (for /login, /signup, etc.) */
  skipAuth?: boolean;
  /** Overrides the default timeout (15s for JSON, 60s for FormData uploads). */
  timeoutMs?: number;
};

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    skipAuth = false,
    timeoutMs,
  } = options;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  // Only set Content-Type for JSON; let FormData set its own boundary
  if (!isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  const effectiveTimeout =
    timeoutMs ?? (isFormData ? UPLOAD_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: isFormData
        ? (body as FormData)
        : body
          ? JSON.stringify(body)
          : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      // No response was ever received — read as connectivity, not a server
      // fault. status 0 falls through every existing status-based branch
      // (401/403/404) to each screen's generic error message.
      throw new ApiError(
        "Request timed out. Check your Wi-Fi connection and try again.",
        0,
        null,
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && !skipAuth) {
      // Session expired or token invalidated server-side. skipAuth is only
      // ever used by the login request itself (lib/api.ts callers grepped),
      // so excluding it here means a wrong-password 401 on /login never
      // triggers this — that's a login failure, not a session expiring,
      // and login.tsx already shows its own inline error for it. Reuse
      // logout() rather than a second token-clearing path.
      await logout();
      router.replace("/(auth)/login");
    }
    const message =
      (isJson && (data as { error?: string }).error) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}
