import { useCallback, useRef, useState, type DragEvent } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from "@/utils/constants";
import { formatBytes } from "@/utils/format";

interface ImageUploaderProps {
  onSelect: (file: File) => void;
  error: string | null;
}

export function ImageUploader({ onSelect, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onSelect(file);
    },
    [onSelect],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="animate-fade-in">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a retinal image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragging) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center transition-colors",
          isDragging
            ? "border-ink/40 bg-subtle"
            : "border-line bg-canvas hover:bg-subtle/60",
        )}
      >
        <span
          className={cn(
            "mb-5 flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
            isDragging ? "border-ink/30 bg-canvas" : "border-line bg-subtle",
          )}
        >
          <UploadCloud className="h-5 w-5 text-ink-secondary" strokeWidth={1.75} />
        </span>

        <p className="text-sm font-medium text-ink">
          {isDragging ? "Release to upload" : "Drop your retinal image here"}
        </p>
        <p className="mt-1 text-xs text-ink-secondary">
          or click to browse your files
        </p>

        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Browse Files
          </Button>
        </div>

        <p className="mt-6 text-2xs text-ink-muted">
          Supported formats: {ACCEPTED_EXTENSIONS.map((e) => e.replace(".", "").toUpperCase()).join(", ")}
          {" · "}
          Max {formatBytes(MAX_FILE_SIZE_BYTES)}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Allow re-selecting the same file.
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-line bg-subtle px-3.5 py-2.5"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={1.75} />
          <p className="text-xs text-ink-secondary">{error}</p>
        </div>
      )}
    </div>
  );
}
