import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { Toggle } from "../components/Toggle";
import { loadWidgets, saveWidgets } from "../data/widgetsStore";
import type { Widget, WidgetPosition } from "../types/widget";

const POSITION_OPTIONS: { value: WidgetPosition; label: string }[] = [
  { value: "bottom-right", label: "Unten rechts" },
  { value: "bottom-left", label: "Unten links" },
  { value: "top-right", label: "Oben rechts" },
  { value: "top-left", label: "Oben links" },
];

function buildEmbedCode(widget: Widget): string {
  return `<!-- ChatBot Widget -->
<div id="chatbot-root"></div>
<script
  src="https://chat.uni-giessen.de/widget.js"
  data-widget-id="${widget.id}"
  data-kb="${widget.kbId}"
  data-routing="${widget.routing}-widget"
  data-lang="de"
  defer
></script>`;
}

function buildDirectUrl(widget: Widget): string {
  return `https://chat.uni-giessen.de/w/${widget.id}`;
}

export function WidgetConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);
  const original = useMemo(() => widgets.find((w) => w.id === id), [widgets, id]);

  const [widget, setWidget] = useState<Widget | undefined>(original);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  if (!widget) {
    return (
      <main className="flex-grow p-gutter max-w-container-max mx-auto w-full">
        <p className="text-on-surface-variant">Widget nicht gefunden.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary hover:underline font-label-sm text-label-sm"
        >
          Zurück zur Übersicht
        </button>
      </main>
    );
  }

  const update = <K extends keyof Widget>(key: K, value: Widget[K]) => {
    setWidget((current) => (current ? { ...current, [key]: value } : current));
  };

  const updateConfig = <K extends keyof Widget["config"]>(key: K, value: Widget["config"][K]) => {
    setWidget((current) => (current ? { ...current, config: { ...current.config, [key]: value } } : current));
  };

  const handleSave = () => {
    const updated = widgets.map((w) => (w.id === widget.id ? widget : w));
    saveWidgets(updated);
    setWidgets(updated);
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleToggleStatus = () => {
    update("status", widget.status === "active" ? "paused" : "active");
  };

  const handleRegenerateApiKey = () => {
    const newKey = `sk-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    updateConfig("apiKey", newKey);
    setShowApiKey(true);
  };

  const handleCopy = async (text: string, kind: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const isActive = widget.status === "active";
  const embedCode = buildEmbedCode(widget);
  const directUrl = buildDirectUrl(widget);

  return (
    <main className="flex-grow max-w-container-max mx-auto w-full">
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-gutter py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleCancel}
              aria-label="Zurück"
              className="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <Icon name="arrow_back" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-md text-headline-md text-on-surface truncate">{widget.name}</h2>
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-bold ${
                    isActive ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? "bg-primary" : "bg-on-surface-variant"}`} />
                  {isActive ? "Aktiv" : "Pause"}
                </span>
              </div>
              <p className="font-mono text-xs text-on-surface-variant truncate">Widget-ID: {widget.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-label-sm text-label-sm transition-colors ${
                isActive
                  ? "border-error text-error hover:bg-error-container"
                  : "border-primary text-primary hover:bg-primary/10"
              }`}
            >
              <Icon name={isActive ? "pause_circle" : "play_circle"} className="text-[18px]" />
              {isActive ? "Widget deaktivieren" : "Widget aktivieren"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg shadow-sm hover:brightness-110 active:scale-95 transition-all font-label-sm text-label-sm"
            >
              Speichern
            </button>
          </div>
        </div>
      </header>

      <div className="p-gutter grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-stack-lg">
          {/* Verbindung */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="link" className="text-primary" />
              Verbindung
            </h3>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant">Knowledge-Base-ID</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-surface border border-outline-variant rounded-lg font-mono text-sm">
                <Icon name="database" className="text-on-surface-variant text-[18px]" />
                {widget.kbId}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="api-key">
                API-Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  readOnly
                  value={widget.config.apiKey}
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-mono text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  aria-label={showApiKey ? "API-Key verbergen" : "API-Key anzeigen"}
                  className="p-3 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Icon name={showApiKey ? "visibility_off" : "visibility"} className="text-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateApiKey}
                  aria-label="API-Key neu generieren"
                  className="p-3 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="refresh" className="text-[18px]" />
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Beim Neugenerieren wird der bisherige API-Key ungültig.
              </p>
            </div>
          </section>

          {/* Gesprächseinstellungen */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="forum" className="text-primary" />
              Gesprächseinstellungen
            </h3>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="start-prompt">
                Start-Prompt
              </label>
              <textarea
                id="start-prompt"
                rows={4}
                value={widget.config.startPrompt}
                onChange={(event) => updateConfig("startPrompt", event.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant" htmlFor="min-depth">
                  Gesprächstiefe (min.)
                </label>
                <input
                  id="min-depth"
                  type="number"
                  min={1}
                  max={widget.config.maxDialogDepth}
                  value={widget.config.minDialogDepth}
                  onChange={(event) => updateConfig("minDialogDepth", Number(event.target.value))}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant" htmlFor="max-depth">
                  Gesprächstiefe (max.)
                </label>
                <input
                  id="max-depth"
                  type="number"
                  min={widget.config.minDialogDepth}
                  value={widget.config.maxDialogDepth}
                  onChange={(event) => updateConfig("maxDialogDepth", Number(event.target.value))}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30">
              <Toggle
                checked={widget.config.saveHistory}
                onChange={(value) => updateConfig("saveHistory", value)}
                label="Gesprächsverlauf speichern"
                description="Speichert Konversationen zur späteren Auswertung."
              />
              <Toggle
                checked={widget.config.feedbackButtons}
                onChange={(value) => updateConfig("feedbackButtons", value)}
                label="Feedback-Schaltflächen"
                description="Zeigt Daumen hoch/runter unter jeder Antwort an."
              />
            </div>
          </section>

          {/* Rate Limits */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="speed" className="text-primary" />
              Rate Limits
            </h3>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-on-surface-variant" htmlFor="rate-minute">
                  Anfragen pro Minute
                </label>
                <span className="font-mono text-sm">{widget.config.rateLimitPerMinute}</span>
              </div>
              <input
                id="rate-minute"
                type="range"
                min={1}
                max={60}
                value={widget.config.rateLimitPerMinute}
                onChange={(event) => updateConfig("rateLimitPerMinute", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-on-surface-variant" htmlFor="rate-user-day">
                  Anfragen pro Nutzer/Tag
                </label>
                <span className="font-mono text-sm">{widget.config.rateLimitPerUserPerDay}</span>
              </div>
              <input
                id="rate-user-day"
                type="range"
                min={1}
                max={500}
                value={widget.config.rateLimitPerUserPerDay}
                onChange={(event) => updateConfig("rateLimitPerUserPerDay", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-on-surface-variant" htmlFor="max-tokens">
                  Max. Tokens pro Antwort
                </label>
                <span className="font-mono text-sm">{widget.config.maxTokensPerAnswer}</span>
              </div>
              <input
                id="max-tokens"
                type="range"
                min={50}
                max={2000}
                step={50}
                value={widget.config.maxTokensPerAnswer}
                onChange={(event) => updateConfig("maxTokensPerAnswer", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-stack-lg">
          {/* Output - Widget Code */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="code" className="text-primary" />
              Output — Widget-Code
            </h3>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant">Einbettungscode</label>
              <div className="relative">
                <pre className="w-full overflow-x-auto px-4 py-3 bg-surface border border-outline-variant rounded-lg font-mono text-xs leading-relaxed whitespace-pre">
                  {embedCode}
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopy(embedCode, "code")}
                  className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-surface-container-lowest border border-outline-variant rounded-md text-xs hover:bg-surface-container-high transition-colors"
                >
                  <Icon name={copied === "code" ? "check" : "content_copy"} className="text-[14px]" />
                  {copied === "code" ? "Kopiert" : "Kopieren"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant">Direkte URL</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={directUrl}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg font-mono text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(directUrl, "url")}
                  aria-label="URL kopieren"
                  className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Icon name={copied === "url" ? "check" : "content_copy"} className="text-[18px]" />
                </button>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="URL öffnen"
                  className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Icon name="open_in_new" className="text-[18px]" />
                </a>
              </div>
            </div>
          </section>

          {/* Erscheinungsbild */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="palette" className="text-primary" />
              Erscheinungsbild
            </h3>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="appearance-title">
                Titel
              </label>
              <input
                id="appearance-title"
                value={widget.config.title}
                onChange={(event) => updateConfig("title", event.target.value)}
                className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant" htmlFor="appearance-greeting">
                Begrüßungstext
              </label>
              <input
                id="appearance-greeting"
                value={widget.config.greeting}
                onChange={(event) => updateConfig("greeting", event.target.value)}
                className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-stack-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant" htmlFor="appearance-color">
                  Akzentfarbe
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="appearance-color"
                    type="color"
                    value={widget.config.accentColor}
                    onChange={(event) => updateConfig("accentColor", event.target.value)}
                    className="h-10 w-12 rounded-lg border border-outline-variant cursor-pointer bg-surface"
                  />
                  <input
                    value={widget.config.accentColor}
                    onChange={(event) => updateConfig("accentColor", event.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant" htmlFor="appearance-position">
                  Position
                </label>
                <select
                  id="appearance-position"
                  value={widget.config.position}
                  onChange={(event) => updateConfig("position", event.target.value as WidgetPosition)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  {POSITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Live preview */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Icon name="visibility" className="text-primary" />
              Vorschau
            </h3>

            <div
              className={`relative h-56 rounded-lg border border-outline-variant bg-surface overflow-hidden`}
            >
              <div
                className={`absolute w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden ${
                  widget.config.position === "bottom-right"
                    ? "bottom-3 right-3"
                    : widget.config.position === "bottom-left"
                    ? "bottom-3 left-3"
                    : widget.config.position === "top-right"
                    ? "top-3 right-3"
                    : "top-3 left-3"
                }`}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: widget.config.accentColor }}
                >
                  <Icon name="smart_toy" className="text-[18px]" />
                  <span className="truncate">{widget.config.title}</span>
                </div>
                <div className="p-3">
                  <div className="bg-surface-container-low rounded-lg px-3 py-2 text-xs text-on-surface">
                    {widget.config.greeting}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
