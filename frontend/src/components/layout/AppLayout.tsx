import type { ReactNode } from "react";
import type { ConnectionStatus, Route } from "@/types";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MEDICAL_DISCLAIMER } from "@/utils/constants";
import { Info } from "lucide-react";

interface AppLayoutProps {
  route: Route;
  status: ConnectionStatus;
  onNavigate: (route: Route) => void;
  onRefreshHealth: () => void;
  children: ReactNode;
}

export function AppLayout({
  route,
  status,
  onNavigate,
  onRefreshHealth,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas text-ink">
      <Sidebar route={route} onNavigate={onNavigate} status={status} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header route={route} status={status} onRefreshHealth={onRefreshHealth} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>

          {/* Medical disclaimer footer */}
          <footer className="border-t border-line">
            <div className="mx-auto flex w-full max-w-6xl items-start gap-2.5 px-6 py-5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
              <p className="text-2xs leading-relaxed text-ink-muted">
                {MEDICAL_DISCLAIMER}
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
