import type { Widget } from "../types/widget";

export const widgets: Widget[] = [
  {
    id: "support-bot",
    name: "Support Bot",
    knowledgeBaseId: "jlu-public-2024",
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
      maxTokensPerAnswer: 500,
      title: "JLU Assistent",
      greeting: "Hallo! Wie kann ich dir heute helfen?",
      accentColor: "#0052ff",
      position: "bottom-right",
    },
  },
  {
    id: "sales-tracker",
    name: "Sales Tracker",
    knowledgeBaseId: "sales-internal-v2",
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
      maxTokensPerAnswer: 300,
      title: "Sales Tracker",
      greeting: "Willkommen zurück! Wobei kann ich unterstützen?",
      accentColor: "#7c4dff",
      position: "bottom-left",
    },
  },
];
