import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { ConversationsShell } from "../components/ConversationsShell";
import { fetchWidgets } from "../data/widgetsStore";
import {
  CONVERSATIONS,
  DASHBOARD_STATS,
  STATUS_STYLES,
  TOP_QUESTIONS,
} from "../data/conversations";

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
    <ConversationsShell widgetId={id} widgetName={widgetName}>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-low/30">
        {/* Bot header card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <h2 className="text-title-lg font-bold">{widgetName ?? "Widget"}</h2>
            <span className="text-sm text-on-surface-variant">
              {DASHBOARD_STATS.gespraecheHeute} Gespräche heute
            </span>
          </div>
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              style={{ fontSize: 18 }}
            />
            <input
              type="text"
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-outline-variant text-sm bg-surface-container-low focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5"
            >
              <p className="text-sm text-on-surface-variant">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-2 ${kpi.accent ? "text-primary" : "text-on-surface"}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        {/* Zuletzt aktiv + Top-Fragen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Zuletzt aktiv */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <h3 className="text-title-md font-semibold mb-4">Zuletzt aktiv</h3>
            <div className="space-y-1">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  to={`/widgets/${id}/gespraeche/${c.id}`}
                  className="flex items-center gap-3 py-2.5 border-b border-outline-variant/60 last:border-0 hover:bg-secondary-container/40 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <span className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-semibold shrink-0">
                    {c.initials}
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{c.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                    {c.status}
                  </span>
                </Link>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">Keine Treffer</p>
              )}
            </div>
          </div>

          {/* Top-Fragen */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <h3 className="text-title-md font-semibold mb-4">Top-Fragen</h3>
            <div className="space-y-4">
              {TOP_QUESTIONS.map((q) => (
                <div key={q.text}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm">{q.text}</span>
                    <span className="text-sm font-semibold tabular-nums">{q.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary-container overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(q.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConversationsShell>
  );
}
