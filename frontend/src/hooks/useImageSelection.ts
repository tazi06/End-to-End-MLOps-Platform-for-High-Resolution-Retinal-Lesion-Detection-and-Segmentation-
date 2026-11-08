import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectedImage } from "@/types";
import { validateImageFile, loadImageMeta } from "@/utils/format";

interface UseImageSelection {
  image: SelectedImage | null;
  error: string | null;
  /** Validate + decode a File; sets `image` on success or `error` on failure. */
  select: (file: File) => Promise<void>;
  /** Clear the current selection and release its object URL. */
  clear: () => void;
}

/**
 * Manages the currently selected source image: validation, readability check,
 * dimension extraction, and object-URL lifecycle (revoked on replace/unmount).
 */
export function useImageSelection(): UseImageSelection {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (currentUrl.current) {
      URL.revokeObjectURL(currentUrl.current);
      currentUrl.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    revoke();
    setImage(null);
    setError(null);
  }, [revoke]);

  const select = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateImageFile(file);
      if (!validation.ok) {
        setError(validation.error ?? "Invalid file.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      try {
        const { width, height } = await loadImageMeta(objectUrl);
        revoke();
        currentUrl.current = objectUrl;
        setImage({
          file,
          objectUrl,
          meta: {
            name: file.name,
            size: file.size,
            type: file.type || "image/*",
            width,
            height,
          },
        });
      } catch {
        URL.revokeObjectURL(objectUrl);
        setError("This image could not be read. Please try another file.");
      }
    },
    [revoke],
  );

  // Release the active object URL when the component using this hook unmounts.
  useEffect(() => revoke, [revoke]);

  return { image, error, select, clear };
}
