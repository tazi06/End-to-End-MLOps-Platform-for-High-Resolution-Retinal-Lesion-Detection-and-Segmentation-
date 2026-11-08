import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, predict } from "@/services/retinaops-api";
import type { AnalysisResult } from "@/types";

export type AnalysisPhase = "idle" | "analyzing" | "success" | "error";

interface UseAnalysis {
  phase: AnalysisPhase;
  result: AnalysisResult | null;
  error: string | null;
  /** Start inference for a file. No-ops if already analyzing (prevents dupes). */
  analyze: (file: File) => Promise<void>;
  /** Cancel an in-flight request. */
  cancel: () => void;
  /** Reset back to idle, clearing result and error. */
  reset: () => void;
}

/**
 * Drives a single inference request: guards against duplicate submissions,
 * supports cancellation, measures duration (via the API client), and maps
 * `ApiError` kinds to friendly messages.
 */
export function useAnalysis(): UseAnalysis {
  const [phase, setPhase] = useState<AnalysisPhase>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setPhase("idle");
    setResult(null);
    setError(null);
  }, [cancel]);

  const analyze = useCallback(async (file: File) => {
    // Guard: never fire a second request while one is in flight.
    if (controllerRef.current) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase("analyzing");
    setError(null);
    setResult(null);

    try {
      const { maskUrl, annotatedUrl, durationMs } = await predict(
        file,
        controller.signal,
      );
      if (!mounted.current || controller.signal.aborted) return;
      setResult({
        maskUrl,
        annotatedUrl,
        durationMs,
        completedAt: Date.now(),
      });
      setPhase("success");
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof ApiError && err.kind === "aborted") {
        // User cancelled — return to idle quietly.
        setPhase("idle");
        return;
      }
      setError(
        err instanceof ApiError
          ? err.message
          : "An unexpected error occurred during analysis.",
      );
      setPhase("error");
    } finally {
      controllerRef.current = null;
    }
  }, []);

  return { phase, result, error, analyze, cancel, reset };
}
