import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ChatBubble,
  ChatLayout,
  Textarea,
} from "@ki4jlu/design-system";
import { Send } from "lucide-react";
import { ConversationsShell } from "../components/ConversationsShell";
import { ProgressBar } from "../components/ProgressBar";
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
          <ChatLayout
            className="rounded-none border-0 shadow-none"
            header={
              <>
                <Avatar initials={selected.initials} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{selected.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {selected.channel}-widget • Gespräch #{selected.id} • {selected.time}
                  </p>
                </div>
                <Badge dot tone={selected.online ? "success" : "neutral"} className="ml-auto shrink-0">
                  {selected.online ? "Online" : "Offline"}
                </Badge>
              </>
            }
            composer={
              <Card>
                <Textarea
                  variant="inline"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
                  }}
                  placeholder="Antwortnachricht eingeben..."
                  rows={3}
                  className="resize-none px-4 py-3"
                />
                <div className="flex items-center justify-end px-3 py-2">
                  <Button onClick={handleSend} disabled={!draft.trim()} size="sm">
                    <Send style={{ fontSize: 16 }} width="1em" height="1em" aria-hidden />
                    Senden
                  </Button>
                </div>
              </Card>
            }
          >
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
                    <ChatBubble from="assistant" className="max-w-full">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {m.sources.map((s, si) => {
                            const SourceIcon = s.icon;
                            return (
                              <span
                                key={si}
                                className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary-container/40 border border-outline-variant rounded-lg px-2.5 py-1"
                              >
                                <SourceIcon style={{ fontSize: 14 }} width="1em" height="1em" aria-hidden />
                                {s.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </ChatBubble>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3 justify-end">
                  <div className="max-w-[75%]">
                    <p className="text-xs text-on-surface-variant mb-1 text-right">
                      {m.author} • {m.time}
                    </p>
                    <ChatBubble from="user" className="max-w-full">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                    </ChatBubble>
                  </div>
                  <Avatar initials={selected.initials} size="sm" className="shrink-0" />
                </div>
              ),
            )}
          </ChatLayout>
        </section>

        {/* Right: user info */}
        <aside className="w-80 shrink-0 border-l border-outline-variant overflow-y-auto">
          <div className="px-6 py-4 border-b border-outline-variant">
            <h3 className="text-title-md font-semibold">Nutzerinfo</h3>
          </div>

          <div className="p-gutter flex flex-col items-center text-center border-b border-outline-variant">
            <Avatar initials={selected.initials} size="lg" className="mb-3" />
            <p className="font-semibold">{selected.name}</p>
            <p className="text-xs text-on-surface-variant truncate max-w-full mt-0.5">{selected.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge dot tone={selected.online ? "success" : "neutral"}>
                {selected.online ? "Online" : "Offline"}
              </Badge>
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
                    <ProgressBar percent={r.percent} className="flex-1 h-1.5" />
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
                <span className="w-2 h-2 rounded-full bg-success" />
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
