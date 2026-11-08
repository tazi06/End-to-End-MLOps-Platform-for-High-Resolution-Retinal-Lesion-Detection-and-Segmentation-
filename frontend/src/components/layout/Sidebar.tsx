import {
  LayoutGrid,
  ScanEye,
  History,
  Settings as SettingsIcon,
} from "lucide-react";
import type { ConnectionStatus, Route } from "@/types";
import { cn } from "@/utils/cn";
import { APP_VERSION } from "@/utils/constants";
import { StatusDot, STATUS_LABEL } from "@/components/ui/StatusDot";

interface SidebarProps {
  route: Route;
  onNavigate: (route: Route) => void;
  status: ConnectionStatus;
}

const NAV: { route: Route; label: string; icon: typeof LayoutGrid }[] = [
  { route: "overview", label: "Overview", icon: LayoutGrid },
  { route: "analysis", label: "Image Analysis", icon: ScanEye },
  { route: "history", label: "Analysis History", icon: History },
  { route: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ route, onNavigate, status }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-canvas">
      {/* Wordmark */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink">
          <span className="block h-3 w-3 rounded-full border-[1.5px] border-canvas">
            <span className="mx-auto mt-[3px] block h-1 w-1 rounded-full bg-canvas" />
          </span>
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          RetinaOps
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2" aria-label="Primary">
        <ul className="space-y-0.5">
          {NAV.map(({ route: r, label, icon: Icon }) => {
            const active = route === r;
            return (
              <li key={r}>
                <button
                  onClick={() => onNavigate(r)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-hover font-medium text-ink"
                      : "text-ink-secondary hover:bg-subtle hover:text-ink",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active ? "text-ink" : "text-ink-muted group-hover:text-ink",
                    )}
                    strokeWidth={1.75}
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: version + connection */}
      <div className="border-t border-line px-4 py-3.5">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="text-xs text-ink-secondary">{STATUS_LABEL[status]}</span>
        </div>
        <p className="mt-1.5 text-2xs text-ink-muted">Version {APP_VERSION}</p>
      </div>
    </aside>
  );
}
