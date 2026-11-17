import type {
  AccidentDetail,
  AccidentFilters,
  AccidentPage,
  DatasetMetadata,
  Health,
  HotspotResult,
  SeverityCount,
} from "./types";

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(25_000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      timeout.aborted
        ? "The API took too long to respond. Check FastAPI and GraphDB, then retry."
        : "Cannot reach the API. Check that FastAPI is running and VITE_API_BASE_URL is correct.",
    );
  }
  if (!response.ok) {
    let message = `The API returned HTTP ${response.status}. Please retry.`;
    try {
      const body = await response.json();
      if (typeof body?.detail?.message === "string")
        message = body.detail.message;
      else if (typeof body?.detail === "string") message = body.detail;
    } catch {
      /* Keep a useful message for non-JSON proxy/server errors. */
    }
    throw new ApiError(message, response.status);
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      "The API returned an unreadable response.",
      response.status,
    );
  }
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>("/api/health", signal),
  dataset: (signal?: AbortSignal) =>
    request<DatasetMetadata>("/api/dataset", signal),
  hotspots: (signal?: AbortSignal, filters?: AccidentFilters) =>
    request<HotspotResult>(`/api/hotspots?${filterParams(filters)}`, signal),
  detail: (id: string, signal?: AbortSignal) =>
    request<AccidentDetail>(`/api/accidents/${encodeURIComponent(id)}`, signal),
  severity: (signal?: AbortSignal, filters?: AccidentFilters) =>
    request<SeverityCount[]>(
      `/api/statistics/severity?${filterParams(filters)}`,
      signal,
    ),
  accidents: (
    limit: number,
    offset: number,
    signal?: AbortSignal,
    filters?: AccidentFilters,
  ) => {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 1000 ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 1_000_000
    ) {
      throw new ApiError("Invalid pagination parameters.");
    }
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    filterParams(filters).forEach((value, key) => params.append(key, value));
    return request<AccidentPage>(`/api/accidents?${params}`, signal);
  },
};

export function filterParams(filters?: AccidentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;
  if (filters.severities.length < 4)
    [...new Set(filters.severities)]
      .sort()
      .forEach((level) => params.append("severity", String(level)));
  if (filters.start_date) params.set("start_date", filters.start_date);
  if (filters.end_date) params.set("end_date", filters.end_date);
  if (filters.street.trim()) params.set("street", filters.street.trim());
  return params;
}
