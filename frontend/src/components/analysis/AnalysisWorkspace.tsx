import { useCallback } from "react";
import type { ConnectionStatus } from "@/types";
import { useImageSelection } from "@/hooks/useImageSelection";
import { useAnalysis } from "@/hooks/useAnalysis";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { ImagePreview } from "@/components/upload/ImagePreview";
import { AnalysisLoading } from "@/components/analysis/AnalysisLoading";
import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { AnalysisError } from "@/components/analysis/AnalysisError";
import { AlertCircle } from "lucide-react";

interface AnalysisWorkspaceProps {
  status: ConnectionStatus;
}

/**
 * Orchestrates the full analysis flow:
 * upload → preview → analyze → loading → results / error.
 */
export function AnalysisWorkspace({ status }: AnalysisWorkspaceProps) {
  const { image, error: selectError, select, clear } = useImageSelection();
  const { phase, result, error: analysisError, analyze, reset } = useAnalysis();

  const handleAnalyze = useCallback(() => {
    if (image) void analyze(image.file);
  }, [image, analyze]);

  const handleRemove = useCallback(() => {
    reset();
    clear();
  }, [reset, clear]);

  const handleReset = useCallback(() => {
    reset();
    clear();
  }, [reset, clear]);

  const disconnected = status === "disconnected";

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Retinal Image Analysis
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-secondary">
          Upload a high-resolution retinal fundus image to run AI-based lesion
          segmentation. The image is processed through sliced inference and
          returned as a segmentation mask and an annotated overlay.
        </p>
      </div>

      {/* Disconnected notice */}
      {disconnected && phase === "idle" && !result && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-line bg-subtle px-3.5 py-2.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
          <p className="text-xs text-ink-secondary">
            The backend appears to be unreachable. You can still select an image,
            but analysis will fail until the connection is restored. Check your{" "}
            <span className="font-mono text-2xs">VITE_API_URL</span> configuration.
          </p>
        </div>
      )}

      {/* State machine */}
      {phase === "success" && result && image ? (
        <AnalysisResults image={image} result={result} onReset={handleReset} />
      ) : phase === "analyzing" && image ? (
        <AnalysisLoading filename={image.meta.name} />
      ) : phase === "error" ? (
        <AnalysisError
          message={analysisError ?? "Something went wrong."}
          onRetry={handleAnalyze}
          onReset={handleReset}
        />
      ) : image ? (
        <ImagePreview
          image={image}
          onAnalyze={handleAnalyze}
          onRemove={handleRemove}
          analyzing={false}
        />
      ) : (
        <ImageUploader onSelect={(f) => void select(f)} error={selectError} />
      )}
    </div>
  );
}
