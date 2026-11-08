import { useCallback, useEffect, useRef, useState } from "react";
import { checkHealth } from "@/services/retinaops-api";
import type { ConnectionStatus } from "@/types";
import { HEALTH_POLL_INTERVAL_MS } from "@/utils/constants";

interface UseHealthCheck {
  status: ConnectionStatus;
  /** Epoch ms of the last completed check, or null. */
  lastChecked: number | null;
  /** Manually trigger a re-check. */
  refresh: () => void;
}

/**
 * Polls the backend `/healthz` endpoint and exposes a live connection status.
 * Re-checks on mount, on an interval, and whenever `refresh()` is called.
 */
export function useHealthCheck(): UseHealthCheck {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();

    const run = async () => {
      if (!mounted.current) return;
      setStatus((prev) => (prev === "checking" ? prev : "checking"));
      const ok = await checkHealth(controller.signal);
      if (!mounted.current) return;
      setStatus(ok ? "connected" : "disconnected");
      setLastChecked(Date.now());
    };

    void run();
    const interval = setInterval(run, HEALTH_POLL_INTERVAL_MS);

    return () => {
      mounted.current = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [nonce]);

  return { status, lastChecked, refresh };
}
