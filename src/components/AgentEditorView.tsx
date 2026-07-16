import { useEffect, useRef, useState } from "react";
import { Button } from "@ki4jlu/design-system";
import { Card } from "@ki4jlu/design-system";
import {
  ArrowLeft,
  Brain,
  Check,
  BookSearch,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Waypoints,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Markdown } from "./Markdown";
import { ModelCombobox } from "./ModelCombobox";
import { Label } from "@ki4jlu/design-system";
import { FormControl, FormItem, FormLabel } from "@ki4jlu/design-system";
import { Input, Textarea } from "@ki4jlu/design-system";
import { streamChatMessage, type ChatMessage } from "../data/chat";
import type { Agent, AgentRule } from "../types/agent";

/** Platzhalter-Kacheln für „Tools & Wissen" (Post-MVP). */
const TOOL_PLACEHOLDERS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Wrench, title: "Native Tools", desc: "Interne Aktionen" },
  { icon: Waypoints, title: "MCP Tools", desc: "Aus globalem Registry" },
  { icon: BookSearch, title: "Wissen (RAG)", desc: "Noch keine Quellen" },
];

interface TestMessage {
  role: "bot" | "user";
  text: string;
  /** UI-Hinweis (Fehler/leer) — wird NICHT als Gesprächsverlauf an das Modell gesendet. */
  notice?: boolean;
}

export interface AgentEditorViewProps {
  agent: Agent;
  isNew: boolean;
  saved: boolean;
  /** Nur Superadmins dürfen löschen – blendet den Löschen-Button ein. */
  canDelete: boolean;
  /** Anzahl Konnektoren, die diesen Agenten verwenden (blockiert das Löschen). */
  usageCount: number;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onUpdate: <K extends keyof Agent>(key: K, value: Agent[K]) => void;
}

export function AgentEditorView({
  agent,
  isNew,
  saved,
  canDelete,
  usageCount,
  onSave,
  onCancel,
  onDelete,
  onUpdate,
}: AgentEditorViewProps) {
  const [messages, setMessages] = useState<TestMessage[]>([
    { role: "bot", text: "Teste den Agenten – stelle eine Frage." },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  // Laufenden Test-Stream abbrechen können (Reset/Unmount).
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // System-Prompt aus System-Prompt + aktiven Regeln zusammenbauen (identisch
  // zur Widget-Vorschau, aber aus den Agent-Feldern gespeist).
  const buildSystemPrompt = (): string => {
    const parts: string[] = [];
    if (agent.systemPrompt.trim()) parts.push(agent.systemPrompt.trim());
    const activeRules = agent.rules
      .filter((r) => r.enabled && r.text.trim())
      .map((r) => `- ${r.text.trim()}`);
    if (activeRules.length) parts.push(`Regeln:\n${activeRules.join("\n")}`);
    return parts.join("\n\n");
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const model = agent.model.trim();
    const history: TestMessage[] = [...messages, { role: "user", text: trimmed }];
    setMessages(history);
    setDraft("");

    if (!model) {
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "⚠️ Bitte zuerst ein Modell angeben.", notice: true },
      ]);
      return;
    }

    setTyping(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const appendToken = (chunk: string) => {
      if (controller.signal.aborted) return;
      setTyping(false);
      setMessages((msgs) => {
        const last = msgs[msgs.length - 1];
        if (last?.role === "bot" && !last.notice) {
          const copy = [...msgs];
          copy[copy.length - 1] = { ...last, text: last.text + chunk };
          return copy;
        }
        return [...msgs, { role: "bot", text: chunk }];
      });
    };

    try {
      const chatMessages: ChatMessage[] = [];
      const system = buildSystemPrompt();
      if (system) chatMessages.push({ role: "system", content: system });
      for (const m of history) {
        if (m.notice) continue;
        chatMessages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }

      const { reply, finishReason } = await streamChatMessage(
        {
          knowledgeBaseId: model,
          messages: chatMessages,
          maxTokens: agent.maxTokens,
          signal: controller.signal,
        },
        appendToken,
      );

      if (controller.signal.aborted) return;
      if (!reply.trim()) {
        const text =
          finishReason === "length"
            ? "⚠️ Token-Limit erreicht, bevor eine Antwort generiert wurde. Erhöhe den Max.-Tokens-Wert."
            : "(leere Antwort)";
        setMessages((msgs) => [...msgs, { role: "bot", text, notice: true }]);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setMessages((msgs) => [...msgs, { role: "bot", text: `⚠️ ${message}`, notice: true }]);
    } finally {
      if (!controller.signal.aborted) setTyping(false);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([{ role: "bot", text: "Teste den Agenten – stelle eine Frage." }]);
    setDraft("");
    setTyping(false);
  };

  const deleteBlocked = usageCount > 0;

  return (
    <main className="flex-grow max-w-container-max mx-auto w-full">
      {/* ── Header ── */}
      <header className="bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-gutter py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="icon" onClick={onCancel} aria-label="Zurück zur Übersicht">
              <ArrowLeft className="text-[20px]" width="1em" height="1em" aria-hidden />
            </Button>
            <div className="min-w-0">
              {isNew ? (
                <h2 className="font-headline-md text-headline-md text-on-surface">Neuer Agent</h2>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Brain className="text-primary text-[22px]" width="1em" height="1em" aria-hidden />
                    <h2 className="font-headline-md text-headline-md text-on-surface truncate">{agent.name}</h2>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant truncate">Agent-ID: {agent.id}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isNew && canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (deleteBlocked) return;
                  if (window.confirm(`Agent „${agent.name}“ endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
                    onDelete();
                  }
                }}
                disabled={deleteBlocked}
                title={deleteBlocked ? `Wird von ${usageCount} Konnektor(en) verwendet` : undefined}
                className="border-error text-error hover:bg-error hover:text-on-error"
              >
                <Trash2 className="text-[18px]" width="1em" height="1em" aria-hidden />
                Agent löschen
              </Button>
            )}
            <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
            <Button
              onClick={onSave}
              disabled={saved || (isNew && (!agent.name.trim() || !agent.model.trim()))}
            >
              {saved ? "Gespeichert" : isNew ? "Erstellen" : "Speichern"}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Two-column grid ── */}
      <div className="p-gutter grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left column — Denkschicht */}
        <div className="lg:col-span-2 space-y-stack-lg">
          <Card className="p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Brain className="text-primary" width="1em" height="1em" aria-hidden />
              Denkschicht
            </h3>

            <FormItem>
              <FormLabel>Name <span className="text-error">*</span></FormLabel>
              <FormControl>
                <Input value={agent.name} onChange={(e) => onUpdate("name", e.target.value)} placeholder="z.B. JLU Assistent" />
              </FormControl>
            </FormItem>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
              <div className="flex flex-col gap-1">
                <Label htmlFor="agent-model">Modell <span className="text-error">*</span></Label>
                <ModelCombobox
                  id="agent-model"
                  value={agent.model}
                  onChange={(value) => onUpdate("model", value)}
                  placeholder="Modell-ID eingeben…"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="agent-max-tokens">Max. Tokens pro Antwort</Label>
                  <span className="font-mono text-sm">{agent.maxTokens}</span>
                </div>
                {/* eslint-disable-next-line design-system/no-raw-ui-elements -- range slider; Input only covers text-like fields */}
                <input
                  id="agent-max-tokens"
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={agent.maxTokens}
                  onChange={(e) => onUpdate("maxTokens", Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="agent-system-prompt">System-Prompt</Label>
              <Textarea
                id="agent-system-prompt"
                rows={5}
                value={agent.systemPrompt}
                onChange={(e) => onUpdate("systemPrompt", e.target.value)}
                className="resize-y"
              />
            </div>

            {/* Regeln */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Regeln</Label>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => onUpdate("rules", [...agent.rules, { text: "", enabled: true } satisfies AgentRule])}
                  className="p-0"
                >
                  <Plus className="text-[16px]" width="1em" height="1em" aria-hidden />
                  Regel hinzufügen
                </Button>
              </div>

              {agent.rules.length === 0 ? (
                <p className="text-xs text-on-surface-variant/60 italic">Keine Regeln definiert.</p>
              ) : (
                <div className="divide-y divide-outline-variant/30 border border-outline-variant rounded-lg overflow-hidden">
                  {agent.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 bg-surface hover:bg-surface-container-low transition-colors">
                      {/* eslint-disable-next-line design-system/no-raw-ui-elements -- custom checkbox toggle; no Checkbox component in the design system and Button padding/hover styles don't fit */}
                      <button
                        type="button"
                        onClick={() => onUpdate("rules", agent.rules.map((r, j) => (j === i ? { ...r, enabled: !r.enabled } : r)))}
                        className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          rule.enabled ? "bg-primary border-primary text-on-primary" : "border-outline-variant bg-surface"
                        }`}
                        aria-label={rule.enabled ? "Deaktivieren" : "Aktivieren"}
                      >
                        {rule.enabled && <Check className="text-[14px]" width="1em" height="1em" aria-hidden />}
                      </button>
                      <Input
                        value={rule.text}
                        onChange={(e) => onUpdate("rules", agent.rules.map((r, j) => (j === i ? { ...r, text: e.target.value } : r)))}
                        placeholder="Neue Regel..."
                        className={`flex-1 border-0 p-0 bg-transparent text-sm ${
                          rule.enabled ? "text-on-surface" : "text-on-surface-variant line-through"
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onUpdate("rules", agent.rules.filter((_, j) => j !== i))}
                        aria-label="Regel entfernen"
                        className="shrink-0"
                      >
                        <X className="text-[16px]" width="1em" height="1em" aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Tools & Wissen — MVP-Platzhalter (Ebene 1) */}
          <Card className="p-6 space-y-stack-sm">
            <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
              <Wrench className="text-primary" width="1em" height="1em" aria-hidden />
              Tools & Wissen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm">
              {TOOL_PLACEHOLDERS.map((ph) => (
                <div key={ph.title} className="border border-dashed border-outline-variant rounded-lg p-4 text-center bg-surface">
                  <ph.icon className="text-on-surface-variant text-[22px]" width="1em" height="1em" aria-hidden />
                  <p className="font-semibold text-sm mt-1">{ph.title}</p>
                  <p className="text-xs text-on-surface-variant">{ph.desc}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wide bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full">
                    Post-MVP
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column — Test-Chat */}
        <div className="space-y-stack-lg">
          <Card className="p-6 space-y-stack-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-base font-bold flex items-center gap-2">
                <MessageSquare className="text-primary" width="1em" height="1em" aria-hidden />
                Test-Chat
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <RefreshCw className="text-[14px]" width="1em" height="1em" aria-hidden />
                Zurücksetzen
              </Button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Testet den reinen Agenten – System-Prompt und aktive Regeln werden gesendet. Vorlagen &amp; Design gehören zum Konnektor.
            </p>

            <div className="h-[420px] rounded-lg border border-outline-variant bg-surface-container-low overflow-hidden flex flex-col">
              <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === "user" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface"
                      }`}
                    >
                      {msg.role === "bot" && !msg.notice ? <Markdown>{msg.text}</Markdown> : msg.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-surface-container-lowest rounded-lg px-3 py-2.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 p-2 border-t border-outline-variant shrink-0 bg-surface-container-lowest">
                <Input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend(draft);
                    }
                  }}
                  placeholder="Nachricht eingeben…"
                  className="flex-1 min-w-0"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => handleSend(draft)}
                  disabled={!draft.trim() || typing}
                  aria-label="Senden"
                  className="shrink-0"
                >
                  <Send className="text-[16px]" width="1em" height="1em" aria-hidden />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
