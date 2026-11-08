import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface ImageLightboxProps {
  open: boolean;
  src: string;
  title: string;
  /** Optional checkerboard background (for transparent masks). */
  transparent?: boolean;
  /** Optional download filename; shows a download button when provided. */
  downloadName?: string;
  onClose: () => void;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;

/**
 * Full-screen image inspector with zoom + drag-to-pan. Renders into a portal,
 * traps Escape to close, and restores body scroll on unmount.
 */
export function ImageLightbox({
  open,
  src,
  title,
  transparent,
  downloadName,
  onClose,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const resetView = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (open) resetView();
  }, [open, src, resetView]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
      if (e.key === "-") setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-canvas/95 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — full resolution`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-medium text-ink truncate">{title}</p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-ink-secondary">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetView} aria-label="Reset view">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {downloadName && (
            <a
              href={src}
              download={downloadName}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:bg-hover"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden",
          transparent && "checkerboard",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onMouseDown={(e) => {
          setDragging(true);
          const startX = e.clientX - offset.x;
          const startY = e.clientY - offset.y;
          const onMove = (ev: MouseEvent) =>
            setOffset({ x: ev.clientX - startX, y: ev.clientY - startY });
          const onUp = () => {
            setDragging(false);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
        onWheel={(e) => {
          const direction = e.deltaY > 0 ? -1 : 1;
          setZoom((z) => clampZoom(z + direction * ZOOM_STEP));
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={src}
            alt={title}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-75"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
