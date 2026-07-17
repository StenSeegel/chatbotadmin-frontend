import { cn } from "@ki4jlu/design-system";

// Horizontaler Balken (Track + Füllung) für Top-Fragen, Bewertungsverteilungen
// u. ä. Ersetzt drei handgebaute Implementierungen. Rein dekorativ — der
// zugehörige Zahlenwert steht als Text daneben. Upstream-Kandidat.
export interface ProgressBarProps {
  /** Füllstand in Prozent (0–100); wird geklemmt. */
  percent: number;
  className?: string;
}

export function ProgressBar({ percent, className }: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, percent));

  return (
    <div
      aria-hidden="true"
      className={cn("h-2 overflow-hidden rounded-full bg-secondary-container", className)}
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}
