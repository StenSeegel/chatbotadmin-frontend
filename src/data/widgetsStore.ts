import { apiFetch } from "../auth/api";
import type { Widget, WidgetConfig } from "../types/widget";

/** Öffentliche, präsentationsbezogene Konfiguration (für widget.js / Standalone-Seite). */
export interface PublicWidgetConfig {
  id: string;
  status: string;
  knowledgeBaseId: string;
  routing: string;
  title: string;
  greeting: string;
  accentColor: string;
  position: string;
  icon: string;
  templates: string[];
  rules: string[];
  startPrompt: string;
  feedbackButtons: boolean;
  maxTokens?: number;
}

export function createDefaultConfig(): WidgetConfig {
  return {
    startPrompt: "Du bist ein hilfreicher Assistent. Beantworte Fragen freundlich und sachlich.",
    templates: [],
    rules: [],
    saveHistory: true,
    feedbackButtons: true,
    rateLimitPerMinute: 15,
    rateLimitPerUserPerDay: 75,
    maxTokensPerAnswer: 2000,
    title: "ChatBot",
    greeting: "Hallo! Wie kann ich dir helfen?",
    accentColor: "#0056b3",
    position: "bottom-right",
  };
}

/**
 * Lädt alle Widgets vom Backend (GET /api/widgets). Quelle der Wahrheit ist das
 * Go-Backend (internal/widgets) – dieselben Daten, die auch das eingebettete
 * widget.js sieht.
 */
export async function fetchWidgets(): Promise<Widget[]> {
  const res = await apiFetch("/api/widgets");
  if (!res.ok) throw new Error(`Widgets konnten nicht geladen werden (HTTP ${res.status})`);
  const data = (await res.json()) as { widgets?: Widget[] };
  return (data.widgets ?? []).map((widget) => ({
    ...widget,
    // Altdaten migrieren: früher hieß das Feld `kbId`. Fehlt beides, "" statt
    // undefined, damit Consumer (z. B. ModelCombobox) nicht auf undefined stoßen.
    knowledgeBaseId: widget.knowledgeBaseId ?? (widget as { kbId?: string }).kbId ?? "",
    // Defensive gegen Teil-Configs: fehlende Felder mit den Defaults auffüllen.
    config: { ...createDefaultConfig(), ...widget.config },
  }));
}

/**
 * Lädt die öffentliche Konfiguration eines Widgets (für die Standalone-Seite /w/:id)
 * direkt vom Backend (GET /api/widgets/:id) – identisch zu dem, was widget.js abruft.
 */
export async function fetchPublicConfig(id: string): Promise<PublicWidgetConfig | null> {
  const res = await apiFetch(`/api/widgets/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Konfiguration konnte nicht geladen werden (HTTP ${res.status})`);
  return (await res.json()) as PublicWidgetConfig;
}

/** Legt ein Widget an oder aktualisiert es (PUT /api/widgets/:id). */
export async function saveWidget(widget: Widget): Promise<Widget> {
  const res = await apiFetch(`/api/widgets/${encodeURIComponent(widget.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(widget),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Speichern fehlgeschlagen (HTTP ${res.status})`);
  }
  return (await res.json()) as Widget;
}

/**
 * Löscht ein Widget (DELETE /api/widgets/:id). Nur für Superadmins erlaubt –
 * das Backend gibt für andere Rollen 403 zurück.
 */
export async function deleteWidget(id: string): Promise<void> {
  const res = await apiFetch(`/api/widgets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Löschen fehlgeschlagen (HTTP ${res.status})`);
  }
}
