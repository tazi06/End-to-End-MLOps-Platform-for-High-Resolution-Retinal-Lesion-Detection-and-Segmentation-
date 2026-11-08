/**
 * RetinaOps API client.
 *
 * Talks to the deployed BentoML `RetinaOpsService`. Contract verified against
 * `service/service.py` and `deployment/deployment.yaml`:
 *
 *   • POST /predict
 *       - Input param is `image: PIL.Image.Image`, which BentoML's auto IO
 *         inference exposes as a multipart/form-data file field named `image`.
 *       - Returns JSON: { "mask.png": "<base64>", "annotated_retina.png": "<base64>" }
 *         (raw base64, no data-URI prefix).
 *
 *   • GET /healthz  → 200 when the service is ready (used by k8s probes).
 *
 * No credentials, no mock responses, no fabricated results.
 */

import type { PredictResponse } from "@/types";
import {
  HEALTH_TIMEOUT_MS,
  PREDICT_TIMEOUT_MS,
} from "@/utils/constants";
import { base64ToPngDataUrl, joinUrl } from "@/utils/format";

/** Error categories surfaced to the UI for tailored messaging. */
export type ApiErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "invalid-response"
  | "aborted"
  | "config";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
  }
}

/**
 * Resolve the configured API base URL. Trailing slashes are tolerated.
 * Throws a `config` ApiError if it is missing or still the placeholder.
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw || raw.includes("<NODE-IP>")) {
    throw new ApiError(
      "config",
      "Backend URL is not configured. Set VITE_API_URL in your .env file.",
    );
  }
  return raw.replace(/\/+$/, "");
}

/** Safely read the base URL without throwing (for display / status checks). */
export function tryGetApiBaseUrl(): string | null {
  try {
    return getApiBaseUrl();
  } catch {
    return null;
  }
}

/**
 * fetch() wrapper that enforces a timeout via AbortController and merges any
 * caller-provided signal.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Chain an externally supplied abort signal into our controller.
  const external = init.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      // Distinguish a user-initiated abort from a timeout.
      if (external?.aborted) {
        throw new ApiError("aborted", "Request was cancelled.");
      }
      throw new ApiError(
        "timeout",
        `Request timed out after ${Math.round(timeoutMs / 1000)}s.`,
      );
    }
    throw new ApiError(
      "network",
      "Could not reach the backend. Check the API URL and that the service is running.",
    );
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Health check against GET /healthz. Resolves true only on a 2xx response.
 * Any network/timeout/non-2xx condition resolves false (never throws).
 */
export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  const base = tryGetApiBaseUrl();
  if (!base) return false;

  try {
    const res = await fetchWithTimeout(
      joinUrl(base, "/healthz"),
      { method: "GET", signal },
      HEALTH_TIMEOUT_MS,
    );
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Run inference on a retinal image.
 * Returns display-ready PNG data URLs for the mask and annotated image,
 * plus the measured round-trip duration.
 */
export async function predict(
  file: File,
  signal?: AbortSignal,
): Promise<{ maskUrl: string; annotatedUrl: string; durationMs: number }> {
  const base = getApiBaseUrl();

  const form = new FormData();
  // Field name MUST match the service method parameter name: `image`.
  form.append("image", file, file.name);

  const started = performance.now();
  const res = await fetchWithTimeout(
    joinUrl(base, "/predict"),
    { method: "POST", body: form, signal, headers: { Accept: "application/json" } },
    PREDICT_TIMEOUT_MS,
  );
  const durationMs = performance.now() - started;

  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new ApiError(
      "http",
      `Inference failed (HTTP ${res.status}${
        res.statusText ? ` ${res.statusText}` : ""
      }).${detail ? ` ${detail}` : ""}`,
      res.status,
    );
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError(
      "invalid-response",
      "The backend did not return valid JSON.",
    );
  }

  if (!isPredictResponse(data)) {
    throw new ApiError(
      "invalid-response",
      "The backend response did not contain the expected 'mask.png' and 'annotated_retina.png' fields.",
    );
  }

  return {
    maskUrl: base64ToPngDataUrl(data["mask.png"]),
    annotatedUrl: base64ToPngDataUrl(data["annotated_retina.png"]),
    durationMs,
  };
}

/** Runtime type guard for the predict response contract. */
function isPredictResponse(value: unknown): value is PredictResponse {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["mask.png"] === "string" &&
    obj["mask.png"].length > 0 &&
    typeof obj["annotated_retina.png"] === "string" &&
    obj["annotated_retina.png"].length > 0
  );
}
