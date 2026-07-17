import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@ki4jlu/design-system";
import { EmptyState } from "./EmptyState";
import { CONVERSATIONS, STATUS_TONES } from "../data/conversations";

// Bewusste Ausnahme: Das Design-System hat kein SplitView-Template, daher
// bleibt diese 3-Spalten-Master-Detail-Hülle die eine handgebaute
// Layout-Ausnahme der App. Sie beherbergt nur noch die
// Gesprächs-Detailroute (Thread-Ansicht).
const STATUS_OPTIONS = ["Alle Status", "Offen", "Neu", "Gelöst"];

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {statusFilter}
                  <ChevronDown style={{ fontSize: 16 }} width="1em" height="1em" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {STATUS_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    selected={option === statusFilter}
                    onSelect={() => setStatusFilter(option)}
                  >
                    {option}
                    {option === statusFilter && (
                      <Check className="ml-auto" style={{ fontSize: 16 }} width="1em" height="1em" aria-hidden />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex-1 min-w-[200px] max-w-md">
              <Input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leadingIcon={<Search width="1em" height="1em" aria-hidden />}
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
              <Badge dot tone="primary">
                Live
              </Badge>
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
                  <Avatar initials={c.initials} size="lg" online aria-label={`${c.name}, online`} />
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
                    <Avatar initials={c.initials} size="sm" className="shrink-0" />
                    <span className="font-semibold text-sm flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-on-surface-variant shrink-0">{c.time}</span>
                  </div>
                  <p className={`text-sm mt-2 truncate ${active ? "text-primary font-medium" : "text-on-surface"}`}>
                    {c.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge tone={STATUS_TONES[c.status]}>
                      {c.status}
                    </Badge>
                    <Badge tone="neutral">{c.channel}</Badge>
                  </div>
                </Link>
              );
            })}
            {filtered.length === 0 && (
              <EmptyState title="Keine Gespräche gefunden" />
            )}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">{children}</div>
      </div>
    </div>
  );
}
