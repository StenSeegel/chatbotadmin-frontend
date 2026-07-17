import { useEffect, useState } from "react";
import { DashboardLayout, Grid } from "@ki4jlu/design-system";
import { AddTile } from "../components/AddTile";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { SearchToolbar, type SortOption, type StatusFilter } from "../components/SearchToolbar";
import { WidgetCard } from "../components/WidgetCard";
import { fetchAgents } from "../data/agentsStore";
import { fetchWidgets } from "../data/widgetsStore";
import type { Widget } from "../types/widget";

export function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Zuordnung agentId → Agent-Name, damit die Karten den verknüpften Agenten
  // statt einer Modell-ID zeigen. Fehlschläge sind unkritisch.
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWidgets()
      .then((w) => {
        setWidgets(w);
        setLoadError(null);
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Unbekannter Fehler"));

    fetchAgents()
      .then((list) => {
        const map: Record<string, string> = {};
        for (const a of list) map[a.id] = a.name;
        setAgentNames(map);
      })
      .catch(() => setAgentNames({}));
  }, []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");

  const filteredWidgets = widgets
    .filter((widget) => {
      if (statusFilter !== "all" && widget.status !== statusFilter) return false;
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return widget.name.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "conversations":
          return b.stats.conversations - a.stats.conversations;
        case "rating":
          return b.stats.rating - a.stats.rating;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <DashboardLayout
      title="Dashboard Übersicht"
      description={`${filteredWidgets.length} Konnektor${filteredWidgets.length === 1 ? "" : "en"}`}
    >
      <SearchToolbar
        value={search}
        onChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
      />

      {loadError && <Alert>Konnektoren konnten nicht geladen werden: {loadError}</Alert>}

      {!loadError && widgets.length > 0 && filteredWidgets.length === 0 && (
        <EmptyState title="Keine Konnektoren gefunden" hint="Suchbegriff oder Filter anpassen." />
      )}

      <Grid cols={4}>
        {filteredWidgets.map((widget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            agentName={widget.agentId ? agentNames[widget.agentId] : undefined}
          />
        ))}
        <AddTile to="/widgets/new" label="Konnektor hinzufügen" hint="Neuen Front (Widget) anlegen" />
      </Grid>
    </DashboardLayout>
  );
}
