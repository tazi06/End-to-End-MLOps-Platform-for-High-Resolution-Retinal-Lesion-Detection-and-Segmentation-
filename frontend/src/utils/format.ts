import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/utils/constants";

/** Format a byte count into a human-readable string (e.g. "2.4 MB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const decimals = exponent === 0 ? 0 : value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[exponent]}`;
}

/** Format a millisecond duration into a compact human string (e.g. "1.28 s"). */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Format pixel dimensions (e.g. "1024 × 1024"). */
export function formatDimensions(width: number, height: number): string {
  if (!width || !height) return "—";
  return `${width} × ${height}`;
}

/** Format an epoch-ms timestamp into a readable local date/time. */
export function formatTimestamp(epochMs: number): string {
  try {
    return new Date(epochMs).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate a candidate upload against accepted types and the size guardrail.
 * Extension is checked as a fallback for browsers/files with empty MIME types.
 */
export function validateImageFile(file: File): FileValidationResult {
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );
  const hasValidMime = (ACCEPTED_MIME_TYPES as readonly string[]).includes(
    file.type,
  );

  if (!hasValidMime && !hasValidExt) {
    return {
      ok: false,
      error: "Unsupported file type. Please upload a JPG, JPEG, or PNG image.",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(
        MAX_FILE_SIZE_BYTES,
      )}.`,
    };
  }

  if (file.size === 0) {
    return { ok: false, error: "File appears to be empty." };
  }

  return { ok: true };
}

/**
 * Decode an image file to confirm it is readable and extract natural
 * dimensions. Rejects if the browser cannot decode the bitmap.
 */
export function loadImageMeta(
  objectUrl: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () =>
      reject(new Error("Image could not be read or is corrupted."));
    img.src = objectUrl;
  });
}

/** Convert a raw base64 string (no data-URI prefix) into a PNG data URL. */
export function base64ToPngDataUrl(base64: string): string {
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  return `data:image/png;base64,${cleaned}`;
}

/**
 * Trigger a browser download for a data URL (or any URL) with a given filename.
 */
export function downloadDataUrl(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Join a base URL and a path without duplicated slashes. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
