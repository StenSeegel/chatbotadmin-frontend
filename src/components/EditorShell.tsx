import type { ReactNode } from "react";
import { Button } from "@ki4jlu/design-system";
import { ArrowLeft } from "lucide-react";

// Editor-Archetyp der App: klebrige Kopfzeile (Zurück, Titel/Meta, Status,
// Aktionen) über einer 3-Spalten-Arbeitsfläche. Bewusst KEIN FormLayout aus
// dem Design-System — die Live-Vorschau rechts braucht die volle
// Container-Breite, nicht die schmale Formularspalte.
export interface EditorShellProps {
  onBack: () => void;
  title: ReactNode;
  /** Kleine ID-/Untertitel-Zeile unter dem Titel. */
  meta?: ReactNode;
  /** Status-Badge neben dem Titel (z. B. Aktiv/Pause). */
  status?: ReactNode;
  /** Rechtsbündige Aktions-Buttons. */
  actions?: ReactNode;
  children: ReactNode;
}

export function EditorShell({ onBack, title, meta, status, actions, children }: EditorShellProps) {
  return (
    <main className="flex-grow w-full">
      {/* ── Header ── */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <div className="flex flex-wrap items-center gap-3 px-gutter py-3 max-w-container-max mx-auto">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Zurück">
            <ArrowLeft className="text-[20px]" width="1em" height="1em" aria-hidden />
          </Button>

          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface truncate">
              {title}
            </h2>
            {meta && <p className="font-mono text-xs text-on-surface-variant truncate">{meta}</p>}
          </div>

          {status}
          <div className="flex-1" />
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </header>

      {/* ── Arbeitsfläche: 3-Spalten-Grid (links 2/3 Formular, rechts 1/3 Vorschau) ── */}
      <div className="p-gutter grid grid-cols-1 lg:grid-cols-3 gap-gutter max-w-container-max mx-auto w-full">
        {children}
      </div>
    </main>
  );
}
