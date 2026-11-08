import type { LesionClass } from "@/types";

/**
 * Static reference data mirrored from the backend service
 * (`service/service.py`). These values are hardcoded in the deployed
 * pipeline, so they are safe to present as configuration — NOT as
 * per-image detection results.
 */

/** Accepted upload MIME types. */
export const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png"] as const;

/** Accepted file extensions (for the file input + messaging). */
export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;

/**
 * Client-side maximum upload size. This is a frontend guardrail only — the
 * backend does not advertise a hard limit. Kept generous for high-resolution
 * fundus images.
 */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/** Request timeout for inference (sliced inference can be slow on CPU). */
export const PREDICT_TIMEOUT_MS = 120_000; // 120s

/** Request timeout for the lightweight health check. */
export const HEALTH_TIMEOUT_MS = 6_000; // 6s

/** How often the connection indicator re-checks backend health. */
export const HEALTH_POLL_INTERVAL_MS = 30_000; // 30s

/**
 * Lesion classes the YOLO26n-Seg model segments. Colors correspond to the
 * RGB values in `CLASS_COLORS` within the backend service.
 */
export const LESION_CLASSES: LesionClass[] = [
  { code: "MA", label: "Microaneurysms", color: "rgb(255, 0, 0)" },
  { code: "HE", label: "Hemorrhages", color: "rgb(0, 0, 255)" },
  { code: "EX", label: "Hard Exudates", color: "rgb(255, 255, 0)" },
  { code: "SE", label: "Soft Exudates", color: "rgb(0, 255, 0)" },
  { code: "OD", label: "Optic Disc", color: "rgb(255, 0, 255)" },
];

/** Known pipeline configuration (hardcoded in the deployed service). */
export const PIPELINE_CONFIG = {
  model: "YOLO26n-Seg (best.pt)",
  confidenceThreshold: 0.25,
  slicing: "SAHI · 1024×1024 · overlap 0.2",
  device: "CPU",
} as const;

/** Application version surfaced in the sidebar. */
export const APP_VERSION = "1.0.0";

/** Medical disclaimer shown in the footer / info sections. */
export const MEDICAL_DISCLAIMER =
  "RetinaOps is intended for research and educational purposes only. AI-generated segmentation results are not intended for clinical diagnosis or medical decision-making.";
