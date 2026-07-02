import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Persistente Quelle der Wahrheit für Widget-Konfigurationen.
 *
 * Sowohl der Produktions-Backend (server/index.mjs) als auch der Vite-Dev-Proxy
 * (vite.config.ts) nutzen dieses Modul, damit Admin-Oberfläche und eingebettetes
 * widget.js dieselben Daten sehen. Gespeichert wird als JSON-Datei; Pfad über
 * WIDGETS_FILE überschreibbar (Default: ./data/widgets.json neben diesem Modul).
 */

const DATA_FILE =
  process.env.WIDGETS_FILE || fileURLToPath(new URL("./data/widgets.json", import.meta.url));

// Lucide-Icon-Namen (Admin) → Material-Symbols-Namen (widget.js-Font).
const ICON_MAP = {
  Bot: "smart_toy",
  Languages: "translate",
  LineChart: "analytics",
  Headset: "headset_mic",
  MessageSquare: "chat",
  Brain: "psychology",
  Sparkles: "auto_awesome",
  Headphones: "headphones",
  Globe: "language",
  MessageCircle: "chat_bubble",
};

// Auslieferung beim ersten Start, falls noch keine Datei existiert.
const SEED = [
  {
    id: "support-bot",
    name: "Support Bot",
    knowledgeBaseId: "jlu/gpt-oss-20b",
    routing: "public",
    status: "active",
    icon: "Languages",
    accent: "primary",
    stats: { conversations: 1204, rating: 4.7 },
    config: {
      startPrompt:
        "Du bist der offizielle Assistent der JLU Gießen. Beantworte Fragen freundlich, sachlich und ausschließlich auf Basis der hinterlegten Wissensdatenbank.",
      templates: ["Was ist die JLU?", "Wie bewerbe ich mich?", "Semesterticket", "Öffnungszeiten"],
      rules: [
        { text: "Nur auf Deutsch antworten", enabled: true },
        { text: "Keine persönlichen Daten speichern", enabled: true },
        { text: "Keine medizinischen Ratschläge geben", enabled: true },
        { text: "Keine Links zu externen Webseiten", enabled: false },
      ],
      saveHistory: true,
      feedbackButtons: true,
      rateLimitPerMinute: 20,
      rateLimitPerUserPerDay: 100,
      maxTokensPerAnswer: 2000,
      title: "JLU Assistent",
      greeting: "Hallo! Wie kann ich dir heute helfen?",
      accentColor: "#0052ff",
      position: "bottom-right",
    },
  },
  {
    id: "sales-tracker",
    name: "Sales Tracker",
    knowledgeBaseId: "jlu/gpt-oss-20b",
    routing: "internal",
    status: "paused",
    icon: "LineChart",
    accent: "secondary",
    stats: { conversations: 389, rating: 4.5 },
    config: {
      startPrompt:
        "Du bist ein interner Assistent für das Vertriebsteam. Hilf bei Fragen zu Verkaufszahlen, Kundenkontakten und internen Prozessen.",
      templates: [],
      rules: [],
      saveHistory: false,
      feedbackButtons: false,
      rateLimitPerMinute: 10,
      rateLimitPerUserPerDay: 50,
      maxTokensPerAnswer: 2000,
      title: "Sales Tracker",
      greeting: "Willkommen zurück! Wobei kann ich unterstützen?",
      accentColor: "#7c4dff",
      position: "bottom-left",
    },
  },
];

function readAll() {
  try {
    if (!existsSync(DATA_FILE)) {
      mkdirSync(dirname(DATA_FILE), { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
      return structuredClone(SEED);
    }
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return structuredClone(SEED);
  }
}

function writeAll(widgets) {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(widgets, null, 2));
}

/** Alle Widgets (vollständige Objekte) – für die Admin-Oberfläche. */
export function listWidgets() {
  return readAll();
}

/** Ein Widget per ID (vollständig) oder undefined. */
export function getWidget(id) {
  return readAll().find((w) => w.id === id);
}

/** Anlegen oder Aktualisieren (per ID). Gibt das gespeicherte Widget zurück. */
export function upsertWidget(widget) {
  if (!widget || typeof widget.id !== "string" || !widget.id) {
    throw new Error("Widget benötigt eine gültige id.");
  }
  const widgets = readAll();
  const idx = widgets.findIndex((w) => w.id === widget.id);
  if (idx >= 0) widgets[idx] = widget;
  else widgets.push(widget);
  writeAll(widgets);
  return widget;
}

/**
 * Öffentlich auslieferbare Konfiguration für widget.js (per data-widget-id).
 * Enthält nur, was die eingebettete UI zum Rendern/Chatten braucht.
 */
export function getPublicConfig(id) {
  const w = getWidget(id);
  if (!w) return undefined;
  const c = w.config || {};
  return {
    id: w.id,
    status: w.status,
    knowledgeBaseId: w.knowledgeBaseId,
    routing: w.routing,
    title: c.title,
    greeting: c.greeting,
    accentColor: c.accentColor,
    position: c.position,
    icon: ICON_MAP[w.icon] || "smart_toy",
    templates: Array.isArray(c.templates) ? c.templates : [],
    // Nur aktive Regeln, als reine Texte – widget.js baut daraus den System-Prompt.
    rules: Array.isArray(c.rules) ? c.rules.filter((r) => r && r.enabled).map((r) => r.text) : [],
    startPrompt: c.startPrompt || "",
    feedbackButtons: c.feedbackButtons !== false,
    maxTokens: typeof c.maxTokensPerAnswer === "number" ? c.maxTokensPerAnswer : undefined,
  };
}
