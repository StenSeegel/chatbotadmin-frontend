import { Icon } from "./Icon";
import type { Widget } from "../types/widget";

const accentClasses: Record<Widget["accent"], { iconBg: string; iconText: string }> = {
  primary: { iconBg: "bg-primary/10", iconText: "text-primary" },
  secondary: { iconBg: "bg-secondary/10", iconText: "text-secondary" },
};

const statusClasses: Record<Widget["status"], { badge: string; dot: string; label: string }> = {
  active: { badge: "bg-primary/10 text-primary", dot: "bg-primary", label: "Aktiv" },
  paused: { badge: "bg-surface-container-highest text-on-surface-variant", dot: "bg-on-surface-variant", label: "Pause" },
};

interface WidgetCardProps {
  widget: Widget;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const accent = accentClasses[widget.accent];
  const status = statusClasses[widget.status];
  const rating = widget.stats.rating.toFixed(1).replace(".", ",");

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 ${accent.iconBg} rounded-xl flex items-center justify-center`}>
          <Icon name={widget.icon} className={accent.iconText} />
        </div>
        <div className={`flex items-center gap-1.5 ${status.badge} px-3 py-1 rounded-full text-label-sm font-bold`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          {status.label}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-headline-md text-headline-md">{widget.name}</h4>
        <div className="flex items-center gap-2 text-on-surface-variant mt-1">
          <Icon name="database" className="text-sm" />
          <span className="font-label-sm">{widget.kbId}</span>
        </div>
      </div>

      <div className="border-t border-outline-variant/30 my-4" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant">Routing</span>
          <span className="font-semibold">{widget.routing}</span>
        </div>
        <div className="flex flex-col border-l border-outline-variant/30 pl-4">
          <span className="text-xs text-on-surface-variant">Gespräche</span>
          <span className="font-semibold">{widget.stats.conversations}</span>
        </div>
        <div className="flex flex-col border-l border-outline-variant/30 pl-4">
          <span className="text-xs text-on-surface-variant">Bewertung</span>
          <span className="font-semibold">{rating} / 5</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-auto">
        <button className="flex flex-col items-center justify-center gap-1 px-1 py-2 border border-outline-variant rounded-lg font-label-sm text-[11px] text-on-surface hover:bg-surface-container-high transition-colors">
          <Icon name="settings" className="text-sm" />
          <span>Einstellungen</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 px-1 py-2 border border-outline-variant rounded-lg font-label-sm text-[11px] text-on-surface hover:bg-surface-container-high transition-colors">
          <Icon name="chat" className="text-sm" />
          <span>Chatbox</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-1 px-1 py-2 border border-outline-variant rounded-lg font-label-sm text-[11px] text-on-surface hover:bg-surface-container-high transition-colors">
          <Icon name="code" className="text-sm" />
          <span>Einbetten</span>
        </button>
      </div>
    </div>
  );
}
