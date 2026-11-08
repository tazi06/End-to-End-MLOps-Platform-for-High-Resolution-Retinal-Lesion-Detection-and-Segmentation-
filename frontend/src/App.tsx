import { useState } from "react";
import type { Route } from "@/types";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnalysisWorkspace } from "@/components/analysis/AnalysisWorkspace";
import { OverviewPage } from "@/components/overview/OverviewPage";
import { HistoryPage } from "@/components/history/HistoryPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export default function App() {
  const [route, setRoute] = useState<Route>("analysis");
  const { status, lastChecked, refresh } = useHealthCheck();

  return (
    <AppLayout
      route={route}
      status={status}
      onNavigate={setRoute}
      onRefreshHealth={refresh}
    >
      {route === "overview" && (
        <OverviewPage status={status} onNavigate={setRoute} />
      )}
      {route === "analysis" && <AnalysisWorkspace status={status} />}
      {route === "history" && <HistoryPage onNavigate={setRoute} />}
      {route === "settings" && (
        <SettingsPage
          status={status}
          lastChecked={lastChecked}
          onRefreshHealth={refresh}
        />
      )}
    </AppLayout>
  );
}
