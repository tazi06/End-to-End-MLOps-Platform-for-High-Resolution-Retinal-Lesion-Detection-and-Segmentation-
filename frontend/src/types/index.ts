/**
 * Shared domain types for RetinaOps.
 *
 * The backend (BentoML `RetinaOpsService.predict`) returns ONLY two base64 PNGs:
 *   { "mask.png": "<base64>", "annotated_retina.png": "<base64>" }
 * It does not return per-class counts, so the frontend never fabricates them.
 */

/** Raw JSON shape returned by the BentoML `/predict` endpoint. */
export interface PredictResponse {
  "mask.png": string;
  "annotated_retina.png": string;
}

/** Metadata describing a user-selected source image. */
export interface ImageMeta {
  name: string;
  /** Size in bytes. */
  size: number;
  /** MIME type, e.g. "image/png". */
  type: string;
  /** Natural pixel width (0 until the image has loaded). */
  width: number;
  /** Natural pixel height (0 until the image has loaded). */
  height: number;
}

/** A selected image plus its object URL for preview. */
export interface SelectedImage {
  file: File;
  /** Object URL for <img> preview. Must be revoked on cleanup. */
  objectUrl: string;
  meta: ImageMeta;
}

/** Decoded, display-ready inference output. */
export interface AnalysisResult {
  /** `data:image/png;base64,...` URL for the segmentation mask. */
  maskUrl: string;
  /** `data:image/png;base64,...` URL for the annotated retina. */
  annotatedUrl: string;
  /** Wall-clock inference duration measured by the frontend, in milliseconds. */
  durationMs: number;
  /** Timestamp (epoch ms) when the result was produced. */
  completedAt: number;
}

/** Backend connectivity states for the health indicator. */
export type ConnectionStatus = "checking" | "connected" | "disconnected";

/** Top-level navigation routes. */
export type Route = "overview" | "analysis" | "history" | "settings";

/** A single retinal lesion class the model can segment (static reference data). */
export interface LesionClass {
  code: string;
  label: string;
  /** CSS color matching the backend `CLASS_COLORS` RGB values. */
  color: string;
}
