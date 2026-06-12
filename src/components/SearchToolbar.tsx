import { Icon } from "./Icon";

export function SearchToolbar() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
      <div className="relative group w-full lg:max-w-md">
        <Icon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors"
        />
        <input
          className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
          placeholder="Widgets durchsuchen..."
          type="text"
        />
      </div>
      <div className="flex gap-3 w-full lg:w-auto">
        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors">
          <Icon name="filter_list" className="text-[20px]" />
          Filter
        </button>
        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors">
          <Icon name="sort" className="text-[20px]" />
          Sortieren
        </button>
        <button className="bg-primary text-on-primary px-6 py-3 rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
          <Icon name="save" />
          <span className="font-label-sm">Speichern</span>
        </button>
      </div>
    </div>
  );
}
