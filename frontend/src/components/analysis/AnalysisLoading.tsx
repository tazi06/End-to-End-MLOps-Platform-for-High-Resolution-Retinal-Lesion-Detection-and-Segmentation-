import { Loader2 } from "lucide-react";
import { PIPELINE_CONFIG } from "@/utils/constants";

interface AnalysisLoadingProps {
  filename: string;
}

/**
 * Loading state shown during inference. Intentionally shows NO fake progress
 * percentage — the backend does not stream progress. It explains the sliced
 * inference pipeline and surfaces an indeterminate indicator only.
 */
export function AnalysisLoading({ filename }: AnalysisLoadingProps) {
  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-canvas px-6 py-14">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle">
          <Loader2 className="h-5 w-5 animate-spin text-ink" strokeWidth={1.75} />
        </span>

        <h3 className="mt-5 text-sm font-medium text-ink">
          Analyzing retinal image…
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
          Processing <span className="font-mono text-2xs text-ink">{filename}</span> through
          sliced inference — the image is divided into overlapping tiles
          ({PIPELINE_CONFIG.slicing}), segmented with {PIPELINE_CONFIG.model}, then
          recombined. High-resolution images on CPU may take a little time.
        </p>

        {/* Indeterminate bar (no fabricated percentage) */}
        <div className="relative mt-6 h-1 w-full overflow-hidden rounded-full bg-subtle">
          <div className="absolute top-0 h-full animate-indeterminate rounded-full bg-ink/70" />
        </div>
      </div>
    </div>
  );
}
