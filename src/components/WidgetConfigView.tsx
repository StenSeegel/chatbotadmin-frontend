import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, CodeBlock } from "@ki4jlu/design-system";
import { Card } from "@ki4jlu/design-system";
import { FormControl, FormItem, FormLabel } from "@ki4jlu/design-system";
import { Input } from "@ki4jlu/design-system";
import { Label } from "@ki4jlu/design-system";
import {
  Brain,
  Check,
  ChevronDown,
  CirclePause,
  CirclePlay,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Gauge,
  Info,
  MessagesSquare,
  Palette,
  Plus,
  RefreshCw,
  Send,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { EditorShell } from "./EditorShell";
import { Markdown } from "./Markdown";
import { Toggle } from "./Toggle";
import { ICON_OPTIONS, POSITION_OPTIONS } from "./widgetOptions";
import { WidgetIcon } from "./WidgetIcon";
import { streamChatMessage, type ChatMessage } from "../data/chat";
import type { Widget, WidgetPosition } from "../types/widget";
import type { Agent } from "../types/agent";

interface PreviewMessage {
  role: "bot" | "user";
  text: string;
  feedback?: "up" | "down" | null;
  /** UI-Hinweis (Fehler/leer) — wird NICHT als Gesprächsverlauf an das Modell gesendet. */
  notice?: boolean;
}

const RATE_SLIDERS = [
  { id: "rate-minute",   label: "Anfragen pro Minute",     key: "rateLimitPerMinute"    as const, min: 1,  max: 60,   step: 1  },
  { id: "rate-user-day", label: "Anfragen pro Nutzer/Tag", key: "rateLimitPerUserPerDay" as const, min: 1,  max: 500,  step: 1  },
  { id: "max-tokens",    label: "Max. Tokens pro Antwort", key: "maxTokensPerAnswer"     as const, min: 50, max: 2000, step: 50 },
];

export interface WidgetConfigViewProps {
  widget: Widget;
  /** Verfügbare Agenten (Ebene 1) für die Auswahl. Der Konnektor verweist nur per agentId. */
  agents: Agent[];
  isNew: boolean;
  isActive: boolean;
  saved: boolean;
  /** Nur Superadmins dürfen einen Konnektor löschen – blendet den Löschen-Button ein. */
  canDelete: boolean;
  copied: "code" | "url" | null;
  embedCode: string;
  directUrl: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onCopy: (text: string, kind: "code" | "url") => void;
  onUpdate: <K extends keyof Widget>(key: K, value: Widget[K]) => void;
  onUpdateConfig: <K extends keyof Widget["config"]>(key: K, value: Widget["config"][K]) => void;
}

export function WidgetConfigView({
  widget,
  agents,
  isNew,
  isActive,
  saved,
  canDelete,
  copied,
  embedCode,
  directUrl,
  onSave,
  onCancel,
  onDelete,
  onToggleStatus,
  onCopy,
  onUpdate,
  onUpdateConfig,
}: WidgetConfigViewProps) {
  // Der verknüpfte Agent (Ebene 1) liefert die Denkschicht: Modell, System-Prompt,
  // Regeln, Token-Limit. Der Konnektor verweist nur per agentId darauf.
  const selectedAgent = agents.find((a) => a.id === widget.agentId) ?? null;

  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>(() => [
    { role: "bot", text: widget.config.greeting || "Hallo! Wie kann ich dir helfen?" },
  ]);
  const [previewDraft, setPreviewDraft] = useState("");
  const [previewTyping, setPreviewTyping] = useState(false);
  // Vorschau zeigt zunächst nur den Chat-Button; erst per Klick öffnet sich das Fenster.
  const [previewOpen, setPreviewOpen] = useState(false);
  // Grundeinstellungen sind beim Erstellen offen, bei bestehenden Konnektoren eingeklappt.
  const [basicsOpen, setBasicsOpen] = useState(isNew);

  // Position von Button und Fenster innerhalb der Vorschau (laut Einstellung).
  const previewPositionClass =
    widget.config.position === "bottom-right" ? "bottom-3 right-3"
    : widget.config.position === "bottom-left" ? "bottom-3 left-3"
    : widget.config.position === "top-right" ? "top-3 right-3"
    : "top-3 left-3";

  // Begrüßungstext live in der Vorschau spiegeln, solange noch kein Gespräch läuft.
  const greeting = widget.config.greeting || "Hallo! Wie kann ich dir helfen?";
  const [prevGreeting, setPrevGreeting] = useState(greeting);
  if (greeting !== prevGreeting) {
    setPrevGreeting(greeting);
    setPreviewMessages((msgs) =>
      msgs.length === 1 && msgs[0].role === "bot" ? [{ role: "bot", text: greeting }] : msgs,
    );
  }

  // Vorschau-Chat bei neuen Nachrichten / während des Streamens nach unten scrollen.
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [previewMessages, previewTyping]);

  // Laufenden Vorschau-Stream abbrechen können (bei Reset/Unmount).
  const previewAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => previewAbortRef.current?.abort(), []);

  // System-Prompt aus dem AGENTEN (System-Prompt + aktive Regeln) zusammenbauen.
  const buildSystemPrompt = (): string => {
    if (!selectedAgent) return "";
    const parts: string[] = [];
    if (selectedAgent.systemPrompt.trim()) parts.push(selectedAgent.systemPrompt.trim());

    const activeRules = selectedAgent.rules
      .filter((r) => r.enabled && r.text.trim())
      .map((r) => `- ${r.text.trim()}`);
    if (activeRules.length) parts.push(`Regeln:\n${activeRules.join("\n")}`);

    return parts.join("\n\n");
  };

  const handlePreviewSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || previewTyping) return;

    const model = selectedAgent?.model.trim() ?? "";
    const history: PreviewMessage[] = [...previewMessages, { role: "user", text: trimmed }];
    setPreviewMessages(history);
    setPreviewDraft("");

    if (!model) {
      setPreviewMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "⚠️ Bitte zuerst einen Agenten mit Modell auswählen.", notice: true },
      ]);
      return;
    }

    setPreviewTyping(true);
    previewAbortRef.current?.abort();
    const controller = new AbortController();
    previewAbortRef.current = controller;

    const appendToken = (chunk: string) => {
      if (controller.signal.aborted) return;
      setPreviewTyping(false);
      setPreviewMessages((msgs) => {
        const last = msgs[msgs.length - 1];
        if (last?.role === "bot" && !last.notice) {
          const copy = [...msgs];
          copy[copy.length - 1] = { ...last, text: last.text + chunk };
          return copy;
        }
        return [...msgs, { role: "bot", text: chunk, feedback: null }];
      });
    };

    try {
      const messages: ChatMessage[] = [];
      const system = buildSystemPrompt();
      if (system) messages.push({ role: "system", content: system });
      for (const m of history) {
        if (m.notice) continue;
        messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }

      const { reply, finishReason } = await streamChatMessage(
        {
          knowledgeBaseId: model,
          messages,
          maxTokens: selectedAgent?.maxTokens,
          signal: controller.signal,
          widgetId: widget.id,
        },
        appendToken,
      );

      if (controller.signal.aborted) return;

      if (!reply.trim()) {
        const text =
          finishReason === "length"
            ? "⚠️ Token-Limit erreicht, bevor eine Antwort generiert wurde. Erhöhe den Wert im Agenten."
            : "(leere Antwort)";
        setPreviewMessages((msgs) => [...msgs, { role: "bot", text, notice: true }]);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setPreviewMessages((msgs) => [...msgs, { role: "bot", text: `⚠️ ${message}`, notice: true }]);
    } finally {
      if (!controller.signal.aborted) setPreviewTyping(false);
    }
  };

  const handlePreviewReset = () => {
    previewAbortRef.current?.abort();
    setPreviewMessages([
      { role: "bot", text: widget.config.greeting || "Hallo! Wie kann ich dir helfen?" },
    ]);
    setPreviewDraft("");
    setPreviewTyping(false);
  };

  const handlePreviewFeedback = (index: number, value: "up" | "down") => {
    setPreviewMessages((msgs) =>
      msgs.map((m, i) => (i === index ? { ...m, feedback: m.feedback === value ? null : value } : m)),
    );
  };

  return (
    <EditorShell
      onBack={onCancel}
      title={
        isNew ? "Neuen Konnektor erstellen" : <span className="truncate">{widget.name}</span>
      }
      meta={isNew ? undefined : `Konnektor · Typ: Widget · ID: ${widget.id}`}
      status={
        !isNew && (
          <Badge dot tone={isActive ? "primary" : "neutral"}>
            {isActive ? "Aktiv" : "Pause"}
          </Badge>
        )
      }
      actions={
        <>
          {!isNew && canDelete && (
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    `Konnektor „${widget.name}“ endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
                  )
                ) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="text-[18px]" width="1em" height="1em" aria-hidden />
              Konnektor löschen
            </Button>
          )}
          {!isNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleStatus}
              className={
                isActive
                  ? "border-error text-error hover:bg-error-container"
                  : "border-primary text-primary hover:bg-primary/10"
              }
            >
              {isActive ? (
                <CirclePause className="text-[18px]" width="1em" height="1em" aria-hidden />
              ) : (
                <CirclePlay className="text-[18px]" width="1em" height="1em" aria-hidden />
              )}
              {isActive ? "Konnektor deaktivieren" : "Konnektor aktivieren"}
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
          <Button
            onClick={onSave}
            disabled={saved || (isNew && (!widget.name.trim() || !widget.agentId))}
          >
            {saved ? "Gespeichert" : isNew ? "Erstellen" : "Speichern"}
          </Button>
        </>
      }
    >
      {/* Left column */}
        <div className="lg:col-span-2 space-y-stack-lg">

          {/* Grundeinstellungen — beim Erstellen offen, bei bestehenden Konnektoren einklappbar */}
          <Card className="p-gutter space-y-stack-sm">
            {isNew ? (
              <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
                <SlidersHorizontal className="text-primary" width="1em" height="1em" aria-hidden />
                Grundeinstellungen
              </h3>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBasicsOpen((o) => !o)}
                aria-expanded={basicsOpen}
                // eslint-disable-next-line design-system/layout-only-classname -- Abschnitts-Header mit mehrzeiliger Beschreibung, bewusst umbruchsfähig
                className="w-full justify-between text-left p-0 whitespace-normal"
              >
                <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="text-primary" width="1em" height="1em" aria-hidden />
                  Grundeinstellungen
                </h3>
                <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                  {basicsOpen ? "Einklappen" : "Bearbeiten"}
                  <ChevronDown className={`text-[20px] transition-transform ${basicsOpen ? "rotate-180" : ""}`} width="1em" height="1em" aria-hidden />
                </span>
              </Button>
            )}

            {basicsOpen && (
              <>
                <FormItem>
                  <FormLabel>
                    Name <span className="text-error">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      value={widget.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        // Titel automatisch mitführen, solange er nicht manuell angepasst wurde.
                        const titleUntouched =
                          widget.config.title === "" ||
                          widget.config.title === "ChatBot" ||
                          widget.config.title === widget.name;
                        if (titleUntouched) onUpdateConfig("title", newName);
                        onUpdate("name", newName);
                      }}
                      placeholder="z.B. Support Bot"
                    />
                  </FormControl>
                </FormItem>

                {/* Agent-Auswahl (Ebene 1) — ersetzt das frühere Feld „Knowledge-Base-ID". */}
                <div className="flex flex-col gap-1">
                  <Label htmlFor="widget-agent">
                    Agent <span className="text-error">*</span>
                  </Label>
                  {agents.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      Noch keine Agenten vorhanden.{" "}
                      <Link to="/agents/new" className="text-primary hover:underline">
                        Jetzt einen anlegen
                      </Link>
                      .
                    </p>
                  ) : (
                    <>
                      <select
                        id="widget-agent"
                        value={widget.agentId ?? ""}
                        onChange={(e) => onUpdate("agentId", e.target.value)}
                        className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      >
                        <option value="" disabled>
                          — Agent wählen —
                        </option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name || "(ohne Namen)"}{a.model ? ` · ${a.model}` : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Brain className="text-[14px]" width="1em" height="1em" aria-hidden />
                        Die Denkschicht (Modell, System-Prompt, Regeln) kommt aus dem Agenten.
                        {selectedAgent && (
                          <Link to={`/agents/${selectedAgent.id}`} className="text-primary hover:underline">
                            „{selectedAgent.name}" bearbeiten
                          </Link>
                        )}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="widget-routing">Routing</Label>
                  <select
                    id="widget-routing"
                    value={widget.routing}
                    onChange={(e) => onUpdate("routing", e.target.value)}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="public">public</option>
                    <option value="internal">internal</option>
                    <option value="private">private</option>
                  </select>
                </div>
              </>
            )}
          </Card>

          {/* Vorlagen & Verhalten des Konnektors — Front-Belange (nicht Agent-Verhalten) */}
          <Card className="p-gutter space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <MessagesSquare className="text-primary" width="1em" height="1em" aria-hidden />
              Vorlagen &amp; Verhalten
            </h3>

            {/* Vorlagen */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  Vorlagen
                  <span className="ml-1 text-on-surface-variant/60">
                    ({widget.config.templates.length}/4)
                  </span>
                </Label>
                <Button
                  type="button"
                  variant="link"
                  disabled={widget.config.templates.length >= 4}
                  onClick={() => onUpdateConfig("templates", [...widget.config.templates, ""])}
                  className="p-0"
                >
                  <Plus className="text-[16px]" width="1em" height="1em" aria-hidden />
                  Vorlage hinzufügen
                </Button>
              </div>

              {widget.config.templates.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 italic">
                  Keine Vorlagen. Nutzer sehen keine Vorschlagchips im Konnektor.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {widget.config.templates.map((tpl, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={tpl}
                        onChange={(e) => {
                          const updated = [...widget.config.templates];
                          updated[i] = e.target.value;
                          onUpdateConfig("templates", updated);
                        }}
                        placeholder={`Vorlage ${i + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdateConfig("templates", widget.config.templates.filter((_, j) => j !== i))}
                        aria-label="Vorlage entfernen"
                        className="text-on-surface-variant hover:text-error hover:bg-error-container shrink-0"
                      >
                        <Trash2 className="text-[18px]" width="1em" height="1em" aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hinweis: System-Prompt & Regeln leben im Agenten */}
            <div className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <Brain className="text-primary text-[16px] mt-0.5" width="1em" height="1em" aria-hidden />
              <span>
                System-Prompt und Regeln werden im Agenten konfiguriert
                {selectedAgent ? (
                  <>
                    {" "}—{" "}
                    <Link to={`/agents/${selectedAgent.id}`} className="text-primary hover:underline">
                      „{selectedAgent.name}" öffnen
                    </Link>
                  </>
                ) : (
                  ", sobald ein Agent gewählt ist."
                )}
              </span>
            </div>

            <div className="divide-y divide-outline-variant/30">
              <Toggle
                checked={widget.config.saveHistory}
                onChange={(v) => onUpdateConfig("saveHistory", v)}
                label="Gesprächsverlauf speichern"
                description="Speichert Konversationen zur späteren Auswertung."
              />
              <Toggle
                checked={widget.config.feedbackButtons}
                onChange={(v) => onUpdateConfig("feedbackButtons", v)}
                label="Feedback-Schaltflächen"
                description="Zeigt Daumen hoch/runter unter jeder Antwort an."
              />
            </div>
          </Card>

          {/* Rate Limits */}
          <Card className="p-gutter space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Gauge className="text-primary" width="1em" height="1em" aria-hidden />
              Rate Limits
            </h3>

            {RATE_SLIDERS.map(({ id, label, key, min, max, step }) => (
              <div key={id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={id}>{label}</Label>
                  <span className="font-mono text-sm">{widget.config[key]}</span>
                </div>
                {/* eslint-disable-next-line design-system/no-raw-ui-elements -- range slider; Input covers text-like inputs only */}
                <input
                  id={id}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={widget.config[key]}
                  onChange={(e) => onUpdateConfig(key, Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-stack-lg">

          {/* Output — Widget-Code */}
          <Card className="p-gutter space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Code className="text-primary" width="1em" height="1em" aria-hidden />
              Output — Einbettung
            </h3>

            {isNew && (
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <Info className="text-[14px]" width="1em" height="1em" aria-hidden />
                Vorschau — ID wird nach dem Erstellen vergeben.
              </p>
            )}

            <div className="flex flex-col gap-1">
              <Label>Einbettungscode</Label>
              <CodeBlock code={embedCode} copyLabel="Kopieren" copiedLabel="Kopiert" />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Direkte URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={directUrl}
                  // eslint-disable-next-line design-system/layout-only-classname -- URL ist Code-Inhalt: Monospace bewusst
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onCopy(directUrl, "url")}
                  aria-label="URL kopieren"
                >
                  {copied === "url" ? (
                    <Check className="text-[18px]" width="1em" height="1em" aria-hidden />
                  ) : (
                    <Copy className="text-[18px]" width="1em" height="1em" aria-hidden />
                  )}
                </Button>
                {!isNew && (
                  <Button
                    asChild
                    variant="outline"
                    size="icon"
                    aria-label="URL öffnen"
                  >
                    <a
                      href={directUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="text-[18px]" width="1em" height="1em" aria-hidden />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Erscheinungsbild */}
          <Card className="p-gutter space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Palette className="text-primary" width="1em" height="1em" aria-hidden />
              Erscheinungsbild
            </h3>

            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input
                  value={widget.config.title}
                  onChange={(e) => onUpdateConfig("title", e.target.value)}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Begrüßungstext</FormLabel>
              <FormControl>
                <Input
                  value={widget.config.greeting}
                  onChange={(e) => onUpdateConfig("greeting", e.target.value)}
                />
              </FormControl>
            </FormItem>

            <div className="grid grid-cols-2 gap-stack-sm">
              <div className="flex flex-col gap-1">
                <Label htmlFor="appearance-color">
                  Akzentfarbe
                </Label>
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line design-system/no-raw-ui-elements -- native color picker swatch, not a text input */}
                  <input
                    id="appearance-color"
                    type="color"
                    value={widget.config.accentColor}
                    onChange={(e) => onUpdateConfig("accentColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-outline-variant cursor-pointer bg-surface"
                  />
                  <Input
                    value={widget.config.accentColor}
                    onChange={(e) => onUpdateConfig("accentColor", e.target.value)}
                    // eslint-disable-next-line design-system/layout-only-classname -- Hex-Wert ist Code-Inhalt: Monospace bewusst
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="appearance-position">
                  Position
                </Label>
                <select
                  id="appearance-position"
                  value={widget.config.position}
                  onChange={(e) => onUpdateConfig("position", e.target.value as WidgetPosition)}
                  className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((iconName) => (
                  <Button
                    key={iconName}
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdate("icon", iconName)}
                    className={`w-11 h-11 rounded-xl border-2 ${
                      widget.icon === iconName
                        ? "border-primary bg-primary/10 hover:bg-primary/10 text-primary"
                        : "border-outline-variant text-on-surface-variant hover:bg-transparent hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    <WidgetIcon name={iconName} size={22} />
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Vorschau */}
          <Card className="p-gutter space-y-stack-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
                <Eye className="text-primary" width="1em" height="1em" aria-hidden />
                Vorschau
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePreviewReset}
              >
                <RefreshCw className="text-[14px]" width="1em" height="1em" aria-hidden />
                Zurücksetzen
              </Button>
            </div>

            <div className="relative h-[420px] rounded-lg border border-outline-variant bg-surface overflow-hidden">
              {/* Geschlossener Zustand: nur der Chat-Button an der eingestellten Position. */}
              {!previewOpen && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewOpen(true)}
                  aria-label="Chat öffnen"
                  className={`absolute w-14 h-14 rounded-full shadow-lg text-white transition-transform hover:scale-105 ${previewPositionClass}`}
                  style={{ backgroundColor: widget.config.accentColor }}
                >
                  <WidgetIcon name={widget.icon || "Bot"} size={26} />
                </Button>
              )}

              {/* Geöffneter Zustand: das Chat-Fenster. */}
              {previewOpen && (
              <div
                className={`absolute w-72 h-96 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden flex flex-col ${previewPositionClass}`}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 text-white shrink-0"
                  style={{ backgroundColor: widget.config.accentColor }}
                >
                  <WidgetIcon name={widget.icon || "Bot"} size={18} />
                  <div className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="truncate text-sm font-semibold">{widget.config.title || "ChatBot"}</span>
                    <span className="flex items-center gap-1 text-[10px] opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                      {widget.routing}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewOpen(false)}
                    aria-label="Chat schließen"
                    // eslint-disable-next-line design-system/layout-only-classname -- Vorschau simuliert das eingebettete widget.js
                    className="p-0.5 rounded text-white hover:bg-white/20 shrink-0"
                  >
                    <X className="text-[18px]" width="1em" height="1em" aria-hidden />
                  </Button>
                </div>

                <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface-container-low">
                  {previewMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                          msg.role === "user" ? "text-white" : "bg-surface-container-lowest text-on-surface"
                        }`}
                        style={msg.role === "user" ? { backgroundColor: widget.config.accentColor } : undefined}
                      >
                        {msg.role === "bot" && !msg.notice ? <Markdown>{msg.text}</Markdown> : msg.text}
                      </div>
                      {msg.role === "bot" && i > 0 && !msg.notice && widget.config.feedbackButtons && (
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreviewFeedback(i, "up")}
                            aria-label="Hilfreich"
                            // eslint-disable-next-line design-system/layout-only-classname -- Vorschau simuliert das eingebettete widget.js
                            className={`p-0.5 rounded hover:bg-transparent ${
                              msg.feedback === "up" ? "text-primary" : "text-on-surface-variant/50 hover:text-primary"
                            }`}
                          >
                            <ThumbsUp className="text-[14px]" width="1em" height="1em" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreviewFeedback(i, "down")}
                            aria-label="Nicht hilfreich"
                            // eslint-disable-next-line design-system/layout-only-classname -- Vorschau simuliert das eingebettete widget.js
                            className={`p-0.5 rounded hover:bg-transparent ${
                              msg.feedback === "down" ? "text-error" : "text-on-surface-variant/50 hover:text-error"
                            }`}
                          >
                            <ThumbsDown className="text-[14px]" width="1em" height="1em" aria-hidden />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  {previewTyping && (
                    <div className="flex items-start">
                      <div className="bg-surface-container-lowest rounded-lg px-3 py-2.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vorschlags-Chips unten links, oberhalb der Eingabe. */}
                {previewMessages.length === 1 && widget.config.templates.filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap justify-start gap-1 px-2 pt-1 pb-1 shrink-0 bg-surface-container-low">
                    {widget.config.templates.filter(Boolean).map((tpl, i) => (
                      <Button
                        key={i}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewSend(tpl)}
                        // eslint-disable-next-line design-system/layout-only-classname -- Vorschau simuliert das eingebettete widget.js
                        className="px-2 py-0.5 rounded-full bg-surface-container-lowest text-[10px] font-medium cursor-pointer"
                        style={{ borderColor: widget.config.accentColor, color: widget.config.accentColor }}
                      >
                        {tpl}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 p-2 border-t border-outline-variant shrink-0">
                  <Input
                    value={previewDraft}
                    onChange={(e) => setPreviewDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePreviewSend(previewDraft);
                      }
                    }}
                    placeholder="Nachricht eingeben…"
                    // eslint-disable-next-line design-system/layout-only-classname -- Vorschau simuliert das eingebettete widget.js
                    className="flex-1 px-3 py-1.5 rounded-full text-xs focus:ring-2 min-w-0"
                    style={{
                      borderColor: widget.config.accentColor,
                      "--tw-ring-color": widget.config.accentColor,
                    } as CSSProperties}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePreviewSend(previewDraft)}
                    disabled={!previewDraft.trim() || previewTyping}
                    aria-label="Senden"
                    className="text-white shrink-0"
                    style={{ backgroundColor: widget.config.accentColor }}
                  >
                    <Send className="text-[16px]" width="1em" height="1em" aria-hidden />
                  </Button>
                </div>
              </div>
              )}
            </div>
          </Card>

        </div>
    </EditorShell>
  );
}
