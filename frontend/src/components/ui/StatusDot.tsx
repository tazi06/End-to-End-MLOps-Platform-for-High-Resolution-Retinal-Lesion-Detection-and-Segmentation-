import type { ConnectionStatus } from "@/types";
import { cn } from "@/utils/cn";

interface StatusDotProps {
  status: ConnectionStatus;
  className?: string;
}

/**
 * Monochrome connection indicator. Uses shape/animation rather than color
 * to respect the strict black & white system:
 *   connected    → solid black dot
 *   checking     → pulsing gray dot
 *   disconnected → hollow ring
 */
export function StatusDot({ status, className }: StatusDotProps) {
  if (status === "connected") {
    return (
      <span
        className={cn("inline-block h-2 w-2 rounded-full bg-ink", className)}
        aria-hidden
      />
    );
  }
  if (status === "checking") {
    return (
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full bg-ink-muted animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full border border-ink-muted bg-transparent",
        className,
      )}
      aria-hidden
    />
  );
}

export const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  checking: "Checking connection",
  disconnected: "Disconnected",
};
