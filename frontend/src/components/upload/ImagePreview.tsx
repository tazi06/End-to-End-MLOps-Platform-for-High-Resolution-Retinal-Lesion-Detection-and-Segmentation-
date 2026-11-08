import { ScanEye, X } from "lucide-react";
import type { SelectedImage } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatBytes, formatDimensions } from "@/utils/format";

interface ImagePreviewProps {
  image: SelectedImage;
  onAnalyze: () => void;
  onRemove: () => void;
  analyzing: boolean;
}

export function ImagePreview({
  image,
  onAnalyze,
  onRemove,
  analyzing,
}: ImagePreviewProps) {
  const { meta, objectUrl } = image;

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-line bg-canvas">
      <div className="grid gap-0 md:grid-cols-[1fr,280px]">
        {/* Image */}
        <div className="flex items-center justify-center bg-subtle p-4 md:p-6">
          <img
            src={objectUrl}
            alt={meta.name}
            className="max-h-[360px] w-auto rounded-lg border border-line object-contain"
          />
        </div>

        {/* Metadata + actions */}
        <div className="flex flex-col justify-between border-t border-line p-5 md:border-l md:border-t-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-ink">Image details</h3>
              <button
                onClick={onRemove}
                disabled={analyzing}
                aria-label="Remove image"
                className="rounded-md p-1 text-ink-muted transition-colors hover:bg-hover hover:text-ink disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-4 space-y-3 text-xs">
              <MetaRow label="Filename" value={meta.name} mono title={meta.name} />
              <MetaRow label="Dimensions" value={formatDimensions(meta.width, meta.height)} />
              <MetaRow label="File size" value={formatBytes(meta.size)} />
              <MetaRow
                label="Type"
                value={meta.type.replace("image/", "").toUpperCase()}
              />
            </dl>
          </div>

          <div className="mt-6 space-y-2">
            <Button
              onClick={onAnalyze}
              loading={analyzing}
              size="lg"
              className="w-full"
            >
              {!analyzing && <ScanEye className="h-4 w-4" strokeWidth={1.75} />}
              {analyzing ? "Analyzing…" : "Analyze Retina"}
            </Button>
            <Button
              onClick={onRemove}
              variant="ghost"
              size="sm"
              disabled={analyzing}
              className="w-full"
            >
              Choose a different image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
  title,
}: {
  label: string;
  value: string;
  mono?: boolean;
  title?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd
        title={title}
        className={`truncate text-right text-ink ${mono ? "font-mono text-2xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
