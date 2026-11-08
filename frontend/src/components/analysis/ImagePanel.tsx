import { useState } from "react";
import { Download, Maximize2 } from "lucide-react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { downloadDataUrl } from "@/utils/format";
import { cn } from "@/utils/cn";

interface ImagePanelProps {
  label: string;
  src: string;
  /** Checkerboard backing for transparent PNGs (the mask). */
  transparent?: boolean;
  /** When set, a download button appears and downloads with this filename. */
  downloadName?: string;
}

/**
 * A single labeled result panel with zoom (lightbox) and optional download.
 * Never alters the underlying image data.
 */
export function ImagePanel({
  label,
  src,
  transparent,
  downloadName,
}: ImagePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <figure className="group flex flex-col overflow-hidden rounded-xl border border-line bg-canvas">
      <figcaption className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="text-xs font-medium text-ink">{label}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setOpen(true)}
            aria-label={`Inspect ${label} at full size`}
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          {downloadName && (
            <button
              onClick={() => downloadDataUrl(src, downloadName)}
              aria-label={`Download ${downloadName}`}
              className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </figcaption>

      <button
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden",
          transparent ? "checkerboard" : "bg-subtle",
        )}
        aria-label={`Open ${label}`}
      >
        <img
          src={src}
          alt={label}
          className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity group-hover:bg-ink/[0.03] group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas/95 px-2.5 py-1.5 text-2xs font-medium text-ink shadow-sm">
            <Maximize2 className="h-3 w-3" />
            Click to inspect
          </span>
        </span>
      </button>

      <ImageLightbox
        open={open}
        src={src}
        title={label}
        transparent={transparent}
        downloadName={downloadName}
        onClose={() => setOpen(false)}
      />
    </figure>
  );
}
