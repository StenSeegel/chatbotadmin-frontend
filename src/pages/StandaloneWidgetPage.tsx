import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { Bot, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { Markdown } from "../components/Markdown";
import { streamChatMessage, type ChatMessage } from "../data/chat";
import { fetchPublicConfig, type PublicWidgetConfig } from "../data/widgetsStore";

interface Message {
  role: "bot" | "user";
  text: string;
  feedback?: "up" | "down" | null;
  /** UI-Hinweis (Fehler/leer) — nicht Teil des Gesprächsverlaufs. */
  notice?: boolean;
}

/** System-Prompt aus Start-Prompt + (bereits aktiven) Regeln zusammenbauen. */
function buildSystemPrompt(config: PublicWidgetConfig): string {
  const parts: string[] = [];
  if (config.startPrompt.trim()) parts.push(config.startPrompt.trim());
  if (config.rules.length) parts.push(`Regeln:\n${config.rules.map((r) => `- ${r}`).join("\n")}`);
  return parts.join("\n\n");
}

/**
 * Standalone-Seite für ein einzelnes Widget (Direkt-URL /w/:id).
 * Öffentlich erreichbar (kein Admin-Login), rendert den Chatbot als Vollseite.
 */
export function StandaloneWidgetPage() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<PublicWidgetConfig | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  // Konfiguration laden.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchPublicConfig(id)
      .then((cfg) => {
        if (cancelled) return;
        if (!cfg) {
          setStatus("not-found");
          return;
        }
        setConfig(cfg);
        setMessages([{ role: "bot", text: cfg.greeting || "Hallo! Wie kann ich dir helfen?" }]);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Unbekannter Fehler");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Browser-Tab benennen.
  useEffect(() => {
    if (config?.title) document.title = config.title;
  }, [config?.title]);

  // Bei neuen Nachrichten / während des Streamens nach unten scrollen.
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const isActive = config?.status === "active";

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing || !config || !isActive) return;

    const history: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(history);
    setDraft("");
    setTyping(true);

    const appendToken = (chunk: string) => {
      setTyping(false);
      setMessages((msgs) => {
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
      const chatMessages: ChatMessage[] = [];
      const system = buildSystemPrompt(config);
      if (system) chatMessages.push({ role: "system", content: system });
      for (const m of history) {
        if (m.notice) continue;
        chatMessages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }

      const { reply, finishReason } = await streamChatMessage(
        { knowledgeBaseId: config.knowledgeBaseId, messages: chatMessages, maxTokens: config.maxTokens, widgetId: config.id },
        appendToken,
      );

      if (!reply.trim()) {
        const text =
          finishReason === "length"
            ? "⚠️ Token-Limit erreicht, bevor eine Antwort generiert wurde."
            : "(leere Antwort)";
        setMessages((msgs) => [...msgs, { role: "bot", text, notice: true }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setMessages((msgs) => [...msgs, { role: "bot", text: `⚠️ ${message}`, notice: true }]);
    } finally {
      setTyping(false);
    }
  };

  const setFeedback = (index: number, value: "up" | "down") => {
    setMessages((msgs) =>
      msgs.map((m, i) => (i === index ? { ...m, feedback: m.feedback === value ? null : value } : m)),
    );
    console.log(`Widget Feedback for ${config?.id}: ${value}`);
  };

  // ── Zustände ohne Chat ──
  if (status === "loading") {
    return <CenteredNotice text="Wird geladen…" />;
  }
  if (status === "not-found") {
    return <CenteredNotice title="Widget nicht gefunden" text={`Kein Widget mit der ID „${id}".`} />;
  }
  if (status === "error" || !config) {
    return <CenteredNotice title="Fehler" text={loadError || "Das Widget konnte nicht geladen werden."} />;
  }

  const accent = config.accentColor || "#0052ff";
  const onlyGreeting = messages.length === 1 && messages[0].role === "bot";

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-grow min-h-screen bg-surface shadow-sm">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-4 text-white" style={{ backgroundColor: accent }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Bot size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="font-semibold text-base leading-tight truncate">{config.title}</h1>
            <p className="text-xs opacity-85 flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: isActive ? "#22c55e" : "#cbd5e1" }}
              />
              {isActive ? "Online" : "Pausiert"}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-surface-container-low">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-br-sm"
                    : "bg-surface text-on-surface border border-outline-variant rounded-bl-sm"
                }`}
                style={msg.role === "user" ? ({ backgroundColor: accent } as CSSProperties) : undefined}
              >
                {msg.role === "bot" && !msg.notice ? <Markdown>{msg.text}</Markdown> : msg.text}
              </div>

              {config.feedbackButtons && msg.role === "bot" && !msg.notice ? (
                <div className="flex gap-1 mt-1 ml-1 text-on-surface-variant">
                  <button
                    type="button"
                    aria-label="Hilfreich"
                    onClick={() => setFeedback(i, "up")}
                    className={`p-1 rounded transition-colors hover:text-on-surface ${
                      msg.feedback === "up" ? "text-primary" : ""
                    }`}
                  >
                    <ThumbsUp size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Nicht hilfreich"
                    onClick={() => setFeedback(i, "down")}
                    className={`p-1 rounded transition-colors hover:text-on-surface ${
                      msg.feedback === "down" ? "text-primary" : ""
                    }`}
                  >
                    <ThumbsDown size={15} />
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          {typing ? (
            <div className="flex items-center gap-1.5 px-1" aria-label="Schreibt…">
              <span className="h-2 w-2 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-on-surface-variant/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-on-surface-variant/50 animate-bounce" />
            </div>
          ) : null}

          {/* Vorschläge (nur vor der ersten Nutzernachricht) */}
          {onlyGreeting && isActive && config.templates.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {config.templates.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => handleSend(tpl)}
                  className="rounded-full border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-container"
                  style={{ color: accent, borderColor: `${accent}66` }}
                >
                  {tpl}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer / Eingabe */}
        <footer className="border-t border-outline-variant bg-surface px-4 py-3">
          {isActive ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(draft);
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Frage eingeben…"
                autoComplete="off"
                className="flex-1 rounded-full border border-outline-variant bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={!draft.trim() || typing}
                aria-label="Senden"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: accent }}
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-on-surface-variant py-1">
              Dieses Widget ist derzeit pausiert.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

function CenteredNotice({ title, text }: { title?: string; text: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-6">
      <div className="text-center">
        {title ? <h1 className="font-headline-md text-lg font-bold text-on-surface mb-1">{title}</h1> : null}
        <p className="text-on-surface-variant text-sm">{text}</p>
      </div>
    </div>
  );
}
