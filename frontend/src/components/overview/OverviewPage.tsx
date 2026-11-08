import { ArrowRight, ScanEye, Layers, Shield } from "lucide-react";
import type { ConnectionStatus, Route } from "@/types";
import { Button } from "@/components/ui/Button";
import { StatusDot, STATUS_LABEL } from "@/components/ui/StatusDot";
import { LESION_CLASSES, PIPELINE_CONFIG } from "@/utils/constants";

interface OverviewPageProps {
  status: ConnectionStatus;
  onNavigate: (route: Route) => void;
}

const STEPS = [
  { n: 1, title: "Upload", text: "Select a retinal fundus image (JPG or PNG)." },
  { n: 2, title: "Slice", text: "SAHI divides the image into overlapping tiles." },
  { n: 3, title: "Segment", text: "YOLO26n-Seg segments lesions on each tile." },
  { n: 4, title: "Combine", text: "Predictions merge into a mask and overlay." },
];

export function OverviewPage({ status, onNavigate }: OverviewPageProps) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          AI-powered retinal lesion segmentation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
          RetinaOps runs high-resolution retinal fundus images through a sliced
          inference pipeline and returns a segmentation mask and an annotated
          overlay. Built for research, experimentation, and education.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={() => onNavigate("analysis")}>
            <ScanEye className="h-4 w-4" strokeWidth={1.75} />
            Start an analysis
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Button>
          <span className="flex items-center gap-2 text-xs text-ink-secondary">
            <StatusDot status={status} />
            Backend {STATUS_LABEL[status].toLowerCase()}
          </span>
        </div>
      </section>

      {/* Workflow */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Inference workflow
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-line bg-canvas p-4"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-subtle text-2xs font-semibold text-ink">
                {s.n}
              </span>
              <p className="mt-3 text-sm font-medium text-ink">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-secondary">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Model + classes */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-canvas p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-ink-secondary" strokeWidth={1.75} />
            <h3 className="text-sm font-medium text-ink">Model configuration</h3>
          </div>
          <dl className="mt-4 space-y-2.5 text-xs">
            <Row label="Model" value={PIPELINE_CONFIG.model} />
            <Row label="Device" value={PIPELINE_CONFIG.device} />
            <Row
              label="Confidence"
              value={PIPELINE_CONFIG.confidenceThreshold.toFixed(2)}
            />
            <Row label="Slicing" value={PIPELINE_CONFIG.slicing} />
          </dl>
        </div>

        <div className="rounded-xl border border-line bg-canvas p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-ink-secondary" strokeWidth={1.75} />
            <h3 className="text-sm font-medium text-ink">Lesion classes</h3>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {LESION_CLASSES.map((c) => (
              <li key={c.code} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-[3px] border border-ink/10"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                />
                <span className="text-xs text-ink">
                  <span className="font-medium">{c.code}</span>
                  <span className="text-ink-secondary"> · {c.label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
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
