import type { ApiErrorEnvelope } from "./types";

const TOKEN_KEY = "talentNationAuthToken";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(status: number, envelope?: ApiErrorEnvelope) {
    super(envelope?.error.message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = envelope?.error.code || "request_failed";
    this.details = envelope?.error.details;
  }
}

export const authToken = {
  get() {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
  exists() {
    return Boolean(window.localStorage.getItem(TOKEN_KEY));
  },
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown>;
  auth?: boolean;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  const useAuth = options.auth !== false;
  const token = authToken.get();

  if (useAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && !(body instanceof Blob) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) authToken.clear();
    throw new ApiError(response.status, payload as ApiErrorEnvelope);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("Backend returned a non-JSON response. Check that /api/v1 is routed to the API server.");
  }

  return payload as T;
};

export const toErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
};
