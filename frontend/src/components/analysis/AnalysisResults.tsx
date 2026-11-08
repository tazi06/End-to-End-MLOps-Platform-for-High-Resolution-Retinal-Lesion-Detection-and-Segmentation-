import { useState, type ReactElement, type ReactNode } from "react";
import { Clock, Download, RotateCcw, Check } from "lucide-react";
import type { AnalysisResult, SelectedImage } from "@/types";
import { ImagePanel } from "@/components/analysis/ImagePanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import {
  LESION_CLASSES,
  PIPELINE_CONFIG,
} from "@/utils/constants";
import {
  downloadDataUrl,
  formatDimensions,
  formatDuration,
} from "@/utils/format";

interface AnalysisResultsProps {
  image: SelectedImage;
  result: AnalysisResult;
  onReset: () => void;
}

type Tab = "original" | "mask" | "annotated";

const TABS: { id: Tab; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "mask", label: "Segmentation Mask" },
  { id: "annotated", label: "Annotated Retina" },
];

export function AnalysisResults({
  image,
  result,
  onReset,
}: AnalysisResultsProps) {
  const [tab, setTab] = useState<Tab>("annotated");

  const panels: Record<Tab, ReactElement> = {
    original: (
      <ImagePanel label="Original" src={image.objectUrl} />
    ),
    mask: (
      <ImagePanel
        label="Segmentation Mask"
        src={result.maskUrl}
        transparent
        downloadName="mask.png"
      />
    ),
    annotated: (
      <ImagePanel
        label="Annotated Retina"
        src={result.annotatedUrl}
        downloadName="annotated_retina.png"
      />
    ),
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Success bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-subtle">
            <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">Analysis complete</p>
            <p className="text-2xs text-ink-muted">
              {image.meta.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
            Analyze another
          </Button>
        </div>
      </div>

      {/* Panels — 3-up on wide screens */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {panels.original}
        {panels.mask}
        {panels.annotated}
      </div>

      {/* Tabbed view — small / medium screens */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Result views"
          className="mb-3 inline-flex rounded-lg border border-line bg-subtle p-0.5"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.id
                  ? "bg-canvas text-ink shadow-sm"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="max-w-md">{panels[tab]}</div>
      </div>

      {/* Metadata + downloads + legend */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Prediction info">
          <InfoRow label="Model" value={PIPELINE_CONFIG.model} />
          <InfoRow
            label="Image size"
            value={formatDimensions(image.meta.width, image.meta.height)}
          />
          <InfoRow
            label="Inference time"
            value={formatDuration(result.durationMs)}
            icon={<Clock className="h-3 w-3 text-ink-muted" />}
          />
          <InfoRow
            label="Confidence threshold"
            value={PIPELINE_CONFIG.confidenceThreshold.toFixed(2)}
          />
          <InfoRow label="Slicing" value={PIPELINE_CONFIG.slicing} />
        </InfoCard>

        <InfoCard title="Lesion classes">
          <p className="mb-3 text-2xs leading-relaxed text-ink-muted">
            Mask and overlay colors correspond to the model's segmentation
            classes. Detection counts are not returned by the backend.
          </p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
        </InfoCard>
      </div>

      {/* Download actions */}
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-subtle/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-ink">Downloads</p>
          <p className="text-2xs text-ink-muted">
            Exact images returned by the backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadDataUrl(result.maskUrl, "mask.png")}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            mask.png
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadDataUrl(result.annotatedUrl, "annotated_retina.png")
            }
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
            annotated_retina.png
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-canvas p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-muted">{label}</span>
      <span className="flex items-center gap-1.5 text-right font-medium text-ink">
        {icon}
        {value}
      </span>
    </div>
  );
}
