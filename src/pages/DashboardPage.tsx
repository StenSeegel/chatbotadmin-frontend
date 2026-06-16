import { useEffect, useState } from "react";
import { AddWidgetCard } from "../components/AddWidgetCard";
import { AddWidgetModal } from "../components/AddWidgetModal";
import { SearchToolbar, type SortOption, type StatusFilter } from "../components/SearchToolbar";
import { WidgetCard } from "../components/WidgetCard";
import { loadWidgets, saveWidgets } from "../data/widgetsStore";
import type { Widget } from "../types/widget";

export function DashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);

  useEffect(() => {
    saveWidgets(widgets);
  }, [widgets]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");

  const handleAddWidget = (widget: Widget) => {
    setWidgets((current) => [...current, widget]);
  };

  const filteredWidgets = widgets
    .filter((widget) => {
      if (statusFilter !== "all" && widget.status !== statusFilter) return false;

      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        widget.name.toLowerCase().includes(query) ||
        widget.kbId.toLowerCase().includes(query) ||
        widget.routing.toLowerCase().includes(query)
      );
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
    <main className="flex-grow p-gutter space-y-stack-lg max-w-container-max mx-auto w-full">
      <SearchToolbar
        value={search}
        onChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
      />

      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <h2 className="font-headline-md text-headline-md text-on-surface">Ihre Widgets</h2>
        <p className="text-on-surface-variant font-body-base text-sm">{filteredWidgets.length} Widgets gefunden</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {filteredWidgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
        <AddWidgetCard onClick={() => setIsAddModalOpen(true)} />
      </div>

      {isAddModalOpen && (
        <AddWidgetModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddWidget}
          existingCount={widgets.length}
        />
      )}
    </main>
  );
}
