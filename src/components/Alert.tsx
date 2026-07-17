import type { ReactNode } from "react";
import { cn } from "@ki4jlu/design-system";

// Fehlerhinweis-Box. Ersetzt den fünffach kopierten
// `border-error/40 bg-error/10`-Block. Upstream-Kandidat.
export interface AlertProps {
  children: ReactNode;
  className?: string;
}

export function Alert({ children, className }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error", className)}
    >
      {children}
    </div>
  );
}
