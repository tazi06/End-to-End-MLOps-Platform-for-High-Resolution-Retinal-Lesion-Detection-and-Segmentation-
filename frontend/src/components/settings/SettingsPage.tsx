import { CheckCircle2, Copy, RefreshCw, XCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ConnectionStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusDot, STATUS_LABEL } from "@/components/ui/StatusDot";
import { tryGetApiBaseUrl } from "@/services/retinaops-api";
import {
  APP_VERSION,
  MEDICAL_DISCLAIMER,
  PIPELINE_CONFIG,
} from "@/utils/constants";
import { formatTimestamp } from "@/utils/format";

interface SettingsPageProps {
  status: ConnectionStatus;
  lastChecked: number | null;
  onRefreshHealth: () => void;
}

export function SettingsPage({
  status,
  lastChecked,
  onRefreshHealth,
}: SettingsPageProps) {
  const apiUrl = tryGetApiBaseUrl();
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    if (!apiUrl) return;
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Backend connection and application information.
        </p>
      </div>

      {/* Backend connection */}
      <section className="rounded-xl border border-line bg-canvas p-5">
        <h3 className="text-sm font-medium text-ink">Backend connection</h3>

        <div className="mt-4 space-y-4">
          <Field label="API URL">
            {apiUrl ? (
              <div className="flex items-center gap-2">
                <code className="truncate rounded-md border border-line bg-subtle px-2 py-1 font-mono text-2xs text-ink">
                  {apiUrl}
                </code>
                <button
                  onClick={copyUrl}
                  className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-hover hover:text-ink"
                  aria-label="Copy API URL"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-ink-secondary">
                <XCircle className="h-3.5 w-3.5" />
                Not configured — set{" "}
                <span className="font-mono text-2xs">VITE_API_URL</span>
              </span>
            )}
          </Field>

          <Field label="Status">
            <div className="flex items-center gap-2">
              <StatusDot status={status} />
              <span className="text-xs text-ink">{STATUS_LABEL[status]}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefreshHealth}
                className="ml-1"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
                Re-check
              </Button>
            </div>
          </Field>

          <Field label="Last checked">
            <span className="text-xs text-ink-secondary">
              {lastChecked ? formatTimestamp(lastChecked) : "—"}
            </span>
          </Field>

          <Field label="Health endpoint">
            <code className="font-mono text-2xs text-ink-secondary">GET /healthz</code>
          </Field>
          <Field label="Inference endpoint">
            <code className="font-mono text-2xs text-ink-secondary">
              POST /predict · multipart field "image"
            </code>
          </Field>
        </div>

        <p className="mt-5 rounded-lg border border-line bg-subtle px-3 py-2.5 text-2xs leading-relaxed text-ink-muted">
          The API URL is read from the{" "}
          <span className="font-mono">VITE_API_URL</span> environment variable at
          build time. Update your <span className="font-mono">.env</span> file and
          restart the dev server (or rebuild) to change it.
        </p>
      </section>

      {/* Model */}
      <section className="rounded-xl border border-line bg-canvas p-5">
        <h3 className="text-sm font-medium text-ink">Model</h3>
        <dl className="mt-4 space-y-2.5 text-xs">
          <Row label="Model" value={PIPELINE_CONFIG.model} />
          <Row label="Device" value={PIPELINE_CONFIG.device} />
          <Row
            label="Confidence threshold"
            value={PIPELINE_CONFIG.confidenceThreshold.toFixed(2)}
          />
          <Row label="Slicing" value={PIPELINE_CONFIG.slicing} />
        </dl>
      </section>

      {/* About */}
      <section className="rounded-xl border border-line bg-canvas p-5">
        <h3 className="text-sm font-medium text-ink">About</h3>
        <dl className="mt-4 space-y-2.5 text-xs">
          <Row label="Application" value="RetinaOps" />
          <Row label="Version" value={APP_VERSION} />
        </dl>
        <p className="mt-4 text-2xs leading-relaxed text-ink-muted">
          {MEDICAL_DISCLAIMER}
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px,1fr] items-center gap-3">
      <span className="text-xs text-ink-muted">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
