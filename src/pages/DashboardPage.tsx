import { AddWidgetCard } from "../components/AddWidgetCard";
import { SearchToolbar } from "../components/SearchToolbar";
import { WidgetCard } from "../components/WidgetCard";
import { widgets } from "../data/widgets";

export function DashboardPage() {
  return (
    <main className="flex-grow p-gutter space-y-stack-lg max-w-container-max mx-auto w-full">
      <SearchToolbar />

      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <h2 className="font-headline-md text-headline-md text-on-surface">Ihre Widgets</h2>
        <p className="text-on-surface-variant font-body-base text-sm">{widgets.length} Widgets gefunden</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {widgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
        <AddWidgetCard />
      </div>
    </main>
  );
}
