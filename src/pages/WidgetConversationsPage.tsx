import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { ConversationsShell } from "../components/ConversationsShell";
import { fetchWidgets } from "../data/widgetsStore";
import { CONVERSATIONS, type Message } from "../data/conversations";

export function WidgetConversationsPage() {
  const { id, convId } = useParams<{ id: string; convId: string }>();
  const [widgetName, setWidgetName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  // Lokal verfasste Antworten je Gespräch (Admin-Antworten).
  const [replies, setReplies] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    fetchWidgets()
      .then((widgets) => {
        if (!ignore) setWidgetName(widgets.find((w) => w.id === id)?.name ?? null);
      })
      .catch(() => {
        if (!ignore) setWidgetName(null);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const selected = CONVERSATIONS.find((c) => c.id === convId) ?? CONVERSATIONS[0];
  const thread = [...selected.messages, ...(replies[selected.id] ?? [])];

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const message: Message = { from: "assistant", author: "Admin User", time: now, text };
    setReplies((prev) => ({ ...prev, [selected.id]: [...(prev[selected.id] ?? []), message] }));
    setDraft("");
  };

  return (
    <ConversationsShell widgetId={id} widgetName={widgetName} activeConvId={selected.id}>
      <div className="flex-1 flex min-h-0">
        {/* Center: chat thread */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Thread header */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-outline-variant">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-sm font-semibold shrink-0">
                {selected.initials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{selected.name}</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {selected.channel}-widget • Gespräch #{selected.id} • {selected.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-secondary-container transition-colors">
                <Icon name="download" style={{ fontSize: 18 }} />
              </button>
              <button className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-secondary-container transition-colors">
                <Icon name="check_circle" style={{ fontSize: 18 }} />
              </button>
              <button className="p-2 rounded-lg border border-error/40 text-error hover:bg-error/10 transition-colors">
                <Icon name="delete" style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-surface-container-low/30">
            <div className="flex justify-center">
              <span className="text-xs text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">
                {selected.dateLabel}
              </span>
            </div>

            {thread.map((m, i) =>
              m.from === "assistant" ? (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/60 border border-outline-variant shrink-0" />
                  <div className="max-w-[75%]">
                    <p className="text-xs text-on-surface-variant mb-1">
                      {m.author} • {m.time}
                    </p>
                    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl rounded-tl-sm px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.sources.map((s, si) => (
                            <span
                              key={si}
                              className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary-container/40 border border-outline-variant rounded-lg px-2.5 py-1"
                            >
                              <Icon name={s.icon} style={{ fontSize: 14 }} />
                              {s.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3 justify-end">
                  <div className="max-w-[75%]">
                    <p className="text-xs text-on-surface-variant mb-1 text-right">
                      {m.author} • {m.time}
                    </p>
                    <div className="bg-primary text-on-primary rounded-2xl rounded-tr-sm px-4 py-3">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-semibold shrink-0">
                    {selected.initials}
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-outline-variant p-4">
            <div className="border border-outline-variant rounded-xl bg-surface-container-lowest">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-outline-variant">
                <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                  <Icon name="format_bold" style={{ fontSize: 16 }} />
                </button>
                <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                  <Icon name="format_italic" style={{ fontSize: 16 }} />
                </button>
                <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                  <Icon name="link" style={{ fontSize: 16 }} />
                </button>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                }}
                placeholder="Antwortnachricht eingeben..."
                rows={3}
                className="w-full px-4 py-3 bg-transparent text-sm resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                    <Icon name="attach_file" style={{ fontSize: 18 }} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                    <Icon name="undo" style={{ fontSize: 18 }} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                    <Icon name="redo" style={{ fontSize: 18 }} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-secondary-container text-on-surface-variant transition-colors">
                    <Icon name="mood" style={{ fontSize: 18 }} />
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Icon name="send" style={{ fontSize: 16 }} />
                  Senden
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right: user info */}
        <aside className="w-80 shrink-0 border-l border-outline-variant overflow-y-auto">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-title-md font-semibold">Nutzerinfo</h3>
          </div>

          <div className="p-6 flex flex-col items-center text-center border-b border-outline-variant">
            <div className="h-20 w-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-2xl font-semibold mb-3">
              {selected.initials}
            </div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-xs text-on-surface-variant truncate max-w-full mt-0.5">{selected.email}</p>
            <div className="flex items-center gap-2 mt-3">
              {selected.online ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant" />
                  Offline
                </span>
              )}
              <span className="text-xs font-medium text-primary bg-primary-container/50 px-2.5 py-1 rounded-full">
                {selected.channel}-widget
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-5 border-b border-outline-variant">
            <h4 className="text-xs font-bold tracking-widest text-on-surface-variant mb-4">DETAILS</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Sprache</span>
                <span className="font-semibold">{selected.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Quelle</span>
                <span className="font-semibold">{selected.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Erste Sitzung</span>
                <span className="font-semibold">{selected.firstSession}</span>
              </div>
            </div>
          </div>

          {/* Bewertung */}
          <div className="px-6 py-5 border-b border-outline-variant">
            <h4 className="text-xs font-bold tracking-widest text-on-surface-variant mb-4">BEWERTUNG</h4>
            <div className="border border-outline-variant rounded-xl p-4">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-primary leading-none">
                    {selected.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">DURCHSCHNITT</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{selected.ratingsTotal}</p>
                  <p className="text-xs text-on-surface-variant">Gesamtbewertungen</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {selected.ratingBreakdown.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant w-2">{r.stars}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-secondary-container overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${r.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KB Routing */}
          <div className="px-6 py-5">
            <h4 className="text-xs font-bold tracking-widest text-on-surface-variant mb-4">KB ROUTING</h4>
            <div className="flex items-center justify-between border border-outline-variant rounded-xl px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Aktive KB
              </span>
              <span className="text-xs font-mono bg-surface-container-high px-2 py-1 rounded">
                {selected.activeKb}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </ConversationsShell>
  );
}
