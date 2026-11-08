import { History } from "lucide-react";
import type { Route } from "@/types";
import { Button } from "@/components/ui/Button";

interface HistoryPageProps {
  onNavigate: (route: Route) => void;
}

/**
 * Analysis History.
 *
 * The deployed backend is stateless and the frontend intentionally does NOT
 * fabricate saved records or invent a persistence layer. This page honestly
 * communicates that no persistent history store is configured, rather than
 * showing fake data.
 */
export function HistoryPage({ onNavigate }: HistoryPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          Analysis History
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-secondary">
          A record of past analyses.
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-canvas px-6 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-subtle">
            <History className="h-5 w-5 text-ink-secondary" strokeWidth={1.75} />
          </span>
          <h3 className="mt-5 text-sm font-medium text-ink">
            No persistent history
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
            The RetinaOps backend is stateless and does not store past results,
            so there is no analysis history to display. Results exist only for
            the duration of a session. To keep a result, use the download
            actions on the analysis screen.
          </p>
          <div className="mt-6">
            <Button size="sm" onClick={() => onNavigate("analysis")}>
              Go to Image Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
