import type { ReactNode } from "react";
import { Stack, cn } from "@ki4jlu/design-system";

// Leerer Zustand für Listen/Suchergebnisse. Ersetzt die verstreuten
// einzeiligen "Keine …"-Absätze mit einem einheitlichen Muster. Upstream-Kandidat.
export interface EmptyStateProps {
  /** Optionales Icon über dem Titel (z. B. <Inbox />). */
  icon?: ReactNode;
  title: string;
  /** Erklärender Zusatz unter dem Titel. */
  hint?: string;
  /** Optionale Aktion (z. B. ein Button "Anlegen"). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, hint, action, className }: EmptyStateProps) {
  return (
    <Stack
      gap="sm"
      align="center"
      className={cn("py-stack-lg text-center text-on-surface-variant", className)}
    >
      {icon && (
        <span aria-hidden="true" className="[&_svg]:h-8 [&_svg]:w-8">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs">{hint}</p>}
      {action}
    </Stack>
  );
}
