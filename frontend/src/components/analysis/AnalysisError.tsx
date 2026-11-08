import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AnalysisErrorProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}

export function AnalysisError({ message, onRetry, onReset }: AnalysisErrorProps) {
  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-canvas px-6 py-12">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle">
          <AlertTriangle className="h-5 w-5 text-ink" strokeWidth={1.75} />
        </span>
        <h3 className="mt-5 text-sm font-medium text-ink">Analysis failed</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{message}</p>

        <div className="mt-6 flex items-center gap-2">
          <Button size="sm" onClick={onRetry}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            Try again
          </Button>
          <Button size="sm" variant="ghost" onClick={onReset}>
            Start over
          </Button>
        </div>
      </div>
    </div>
  );
}
