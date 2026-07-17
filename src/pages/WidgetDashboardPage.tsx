import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Badge, Card, DashboardLayout, Grid, Input } from "@ki4jlu/design-system";
import { Search } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { ProgressBar } from "../components/ProgressBar";
import { StatCard } from "../components/StatCard";
import { fetchWidgets } from "../data/widgetsStore";
import {
  CONVERSATIONS,
  DASHBOARD_STATS,
  STATUS_TONES,
  TOP_QUESTIONS,
} from "../data/conversations";

// Per-Widget-Dashboard als eigenständige DashboardLayout-Seite (gleicher
// Archetyp wie Dashboard/Statistiken). Die Master-Detail-Shell bleibt der
// Gesprächs-Detailansicht vorbehalten.
export function WidgetDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [widgetName, setWidgetName] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    fetchWidgets()
      .then((widgets) => {
        if (!ignore) setWidgetName(widgets.find((w) => w.id === id)?.name ?? null);
      })
      .catch(() => {
        if (!ignore) setWidgetName(null);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const recent = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return CONVERSATIONS;
    return CONVERSATIONS.filter((c) => c.name.toLowerCase().includes(query));
  }, [search]);

  const maxCount = Math.max(...TOP_QUESTIONS.map((q) => q.count));

  const kpis = [
    { label: "Gespräche", value: DASHBOARD_STATS.gespraecheGesamt.toLocaleString("de-DE"), accent: false },
    { label: "Offen", value: String(DASHBOARD_STATS.offen), accent: true },
    { label: "Ø Antwort", value: DASHBOARD_STATS.antwortzeit, accent: false },
    { label: "Bewertung", value: DASHBOARD_STATS.bewertung.toFixed(1), accent: false },
  ];

  return (
    <DashboardLayout
      title={
        <span className="flex items-center gap-stack-sm">
          {widgetName ?? "Widget"}
          <Badge dot tone="success">
            Online
          </Badge>
        </span>
      }
      description={`${DASHBOARD_STATS.gespraecheHeute} Gespräche heute`}
      actions={
        <Input
          leadingIcon={<Search aria-hidden />}
          type="text"
          placeholder="Suchen..."
          aria-label="Gespräche durchsuchen"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
      }
      stats={
        <>
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} />
          ))}
        </>
      }
    >
      <Grid cols={2}>
        {/* Zuletzt aktiv */}
        <Card className="p-gutter">
          <h3 className="text-title-md font-semibold mb-4">Zuletzt aktiv</h3>
          <div className="space-y-1">
            {recent.map((c) => (
              <Link
                key={c.id}
                to={`/widgets/${id}/gespraeche/${c.id}`}
                className="flex items-center gap-3 py-2.5 border-b border-outline-variant/60 last:border-0 hover:bg-secondary-container/40 -mx-2 px-2 rounded-lg transition-colors"
              >
                <Avatar size="sm" initials={c.initials} />
                <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                <Badge tone={STATUS_TONES[c.status]}>{c.status}</Badge>
              </Link>
            ))}
            {recent.length === 0 && <EmptyState title="Keine Treffer" hint="Suchbegriff anpassen." />}
          </div>
        </Card>

        {/* Top-Fragen */}
        <Card className="p-gutter">
          <h3 className="text-title-md font-semibold mb-4">Top-Fragen</h3>
          <div className="space-y-4">
            {TOP_QUESTIONS.map((q) => (
              <div key={q.text}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">{q.text}</span>
                  <span className="text-sm font-semibold tabular-nums">{q.count}</span>
                </div>
                <ProgressBar percent={(q.count / maxCount) * 100} />
              </div>
            ))}
          </div>
        </Card>
      </Grid>
    </DashboardLayout>
  );
}
