import { RefreshCw } from "lucide-react";
import type { ConnectionStatus, Route } from "@/types";
import { cn } from "@/utils/cn";
import { StatusDot, STATUS_LABEL } from "@/components/ui/StatusDot";

interface HeaderProps {
  route: Route;
  status: ConnectionStatus;
  onRefreshHealth: () => void;
}

const PAGE_META: Record<Route, { title: string; breadcrumb: string[] }> = {
  overview: { title: "Overview", breadcrumb: ["RetinaOps", "Overview"] },
  analysis: { title: "Image Analysis", breadcrumb: ["RetinaOps", "Image Analysis"] },
  history: { title: "Analysis History", breadcrumb: ["RetinaOps", "Analysis History"] },
  settings: { title: "Settings", breadcrumb: ["RetinaOps", "Settings"] },
};

export function Header({ route, status, onRefreshHealth }: HeaderProps) {
  const meta = PAGE_META[route];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-canvas/80 px-6 backdrop-blur">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-2xs text-ink-muted">
          {meta.breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              <span className={i === meta.breadcrumb.length - 1 ? "text-ink-secondary" : ""}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
        <h1 className="text-sm font-semibold tracking-tight text-ink">{meta.title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefreshHealth}
          className={cn(
            "group flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5",
            "text-xs text-ink-secondary transition-colors hover:bg-hover hover:text-ink",
          )}
          title="Re-check backend connection"
        >
          <StatusDot status={status} />
          <span>{STATUS_LABEL[status]}</span>
          <RefreshCw
            className={cn(
              "h-3 w-3 text-ink-muted transition-transform group-hover:rotate-90",
              status === "checking" && "animate-spin",
            )}
          />
        </button>
      </div>
    </header>
  );
}
