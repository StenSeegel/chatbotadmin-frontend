import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { createDefaultConfig } from "../data/widgetsStore";
import type { Widget, WidgetAccent } from "../types/widget";

const ICON_OPTIONS = [
  "smart_toy",
  "language",
  "analytics",
  "support_agent",
  "forum",
  "psychology",
  "auto_awesome",
  "headset_mic",
  "translate",
  "chat_bubble",
];

interface AddWidgetModalProps {
  onClose: () => void;
  onAdd: (widget: Widget) => void;
  existingCount: number;
}

export function AddWidgetModal({ onClose, onAdd, existingCount }: AddWidgetModalProps) {
  const [name, setName] = useState("");
  const [kbId, setKbId] = useState("");
  const [routing, setRouting] = useState("public");
  const [icon, setIcon] = useState(ICON_OPTIONS[existingCount % ICON_OPTIONS.length]);
  const [accent, setAccent] = useState<WidgetAccent>(existingCount % 2 === 0 ? "primary" : "secondary");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !kbId.trim()) return;

    const id = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    onAdd({
      id: id || crypto.randomUUID(),
      name: name.trim(),
      kbId: kbId.trim(),
      routing: routing.trim(),
      status: "active",
      icon,
      accent,
      stats: { conversations: 0, rating: 0 },
      config: createDefaultConfig(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md">Widget hinzufügen</h3>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-stack-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant" htmlFor="widget-name">
              Name
            </label>
            <input
              id="widget-name"
              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z.B. Support Bot"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant" htmlFor="widget-kb-id">
              Knowledge-Base-ID
            </label>
            <input
              id="widget-kb-id"
              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={kbId}
              onChange={(event) => setKbId(event.target.value)}
              placeholder="z.B. jlu-public-2024"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant" htmlFor="widget-routing">
              Routing
            </label>
            <input
              id="widget-routing"
              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={routing}
              onChange={(event) => setRouting(event.target.value)}
              placeholder="z.B. public"
            />
          </div>

          <div className="grid grid-cols-2 gap-stack-sm">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="widget-icon">
                Icon
              </label>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-xl">
                  <Icon name={icon} />
                </span>
                <select
                  id="widget-icon"
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  value={icon}
                  onChange={(event) => setIcon(event.target.value)}
                >
                  {ICON_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="widget-accent">
                Akzentfarbe
              </label>
              <select
                id="widget-accent"
                className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={accent}
                onChange={(event) => setAccent(event.target.value as WidgetAccent)}
              >
                <option value="primary">Primär</option>
                <option value="secondary">Sekundär</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="bg-primary text-on-primary px-6 py-3 rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all font-label-sm text-label-sm"
            >
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
