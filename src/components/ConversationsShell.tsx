import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button, Input, MenuItem } from "@ki4jlu/design-system";
import { CONVERSATIONS, STATUS_STYLES } from "../data/conversations";

const STATUS_OPTIONS = ["Alle Status", "Offen", "Neu", "Gelöst"];

// ── Small dropdown (display + selectable) ─────────────────────

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant font-body-base text-sm text-on-surface-variant hover:bg-secondary-container transition-colors whitespace-nowrap"
      >
        {value}
        <ChevronDown style={{ fontSize: 16 }} width="1em" height="1em" aria-hidden />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 min-w-full w-max rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden">
            {options.map((option) => (
              <MenuItem
                key={option}
                type="button"
                selected={option === value}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
                {option === value && (
                  <Check className="ml-auto" style={{ fontSize: 16 }} width="1em" height="1em" aria-hidden />
                )}
              </MenuItem>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Gemeinsame Hülle der Gesprächsprotokoll-Seiten: Kopfzeile mit Filtern und
 * linke Gesprächsliste. Der Hauptbereich (`children`) enthält je Seite das
 * Mini-Dashboard (Übersicht) oder die Chat-Detailansicht.
 */
export function ConversationsShell({
  widgetId,
  widgetName,
  activeConvId,
  children,
}: {
  widgetId?: string;
  widgetName: string | null;
  activeConvId?: string;
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alle Status");

  const onlineUsers = CONVERSATIONS.filter((c) => c.online);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CONVERSATIONS.filter((c) => {
      if (statusFilter !== "Alle Status" && c.status !== statusFilter) return false;
      if (!query) return true;
      return c.name.toLowerCase().includes(query) || c.preview.toLowerCase().includes(query);
    });
  }, [search, statusFilter]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="shrink-0 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-4 px-6 py-4">
          <h2 className="text-headline-md font-semibold shrink-0">
            {widgetName ? `${widgetName} Gesprächsprotokolle` : "Gesprächsprotokolle"}
          </h2>

          <div className="flex items-center gap-2 flex-1 justify-end flex-wrap">
            <FilterDropdown value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} />

            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                style={{ fontSize: 18 }}
                width="1em"
                height="1em"
                aria-hidden
              />
              <Input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-surface-container-lowest"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Body: left conversation list + main area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: conversation list */}
        <aside className="w-80 shrink-0 border-r border-outline-variant flex flex-col min-h-0">
          <div className="px-4 py-4 border-b border-outline-variant">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-title-md font-semibold">Gespräche</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{filtered.length} Ergebnisse</p>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-container/50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            </div>

            {/* Online-Nutzer (aus den Gesprächen mit Online-Status) */}
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {onlineUsers.map((c) => (
                <Link
                  key={c.id}
                  to={`/widgets/${widgetId}/gespraeche/${c.id}`}
                  className="flex flex-col items-center gap-1 shrink-0"
                  title={c.name}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-semibold">
                      {c.initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface" />
                  </div>
                  <span className="text-xs text-on-surface-variant">{c.name.split(" ")[0]}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => {
              const active = c.id === activeConvId;
              return (
                <Link
                  key={c.id}
                  to={`/widgets/${widgetId}/gespraeche/${c.id}`}
                  className={`block w-full text-left px-4 py-4 border-b border-outline-variant transition-colors ${
                    active
                      ? "bg-secondary-container text-on-secondary-container border-l-4 border-l-primary"
                      : "hover:bg-secondary-container/50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-semibold shrink-0">
                      {c.initials}
                    </div>
                    <span className="font-semibold text-sm flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-on-surface-variant shrink-0">{c.time}</span>
                  </div>
                  <p className={`text-sm mt-2 truncate ${active ? "text-primary font-medium" : "text-on-surface"}`}>
                    {c.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                      {c.channel}
                    </span>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">Keine Gespräche gefunden</p>
            )}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">{children}</div>
      </div>
    </div>
  );
}
