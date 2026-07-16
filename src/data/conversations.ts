// Demo-Daten für Gesprächsprotokolle eines Widgets (Mini-Dashboard + Detailansicht).
// Wird von WidgetDashboardPage (Übersicht) und WidgetConversationsPage (Detail) geteilt.

import { FileText, Link, type LucideIcon } from "lucide-react";

export type ConversationStatus = "Offen" | "Neu" | "Gelöst";

export interface Message {
  from: "assistant" | "user";
  author: string;
  time: string;
  text: string;
  sources?: { label: string; icon: LucideIcon }[];
}

export interface RatingBreakdown {
  stars: 5 | 4 | 3 | 2 | 1;
  percent: number;
}

export interface Conversation {
  id: string;
  initials: string;
  name: string;
  email: string;
  time: string;
  preview: string;
  status: ConversationStatus;
  online: boolean;
  channel: string;
  language: string;
  source: string;
  firstSession: string;
  rating: number;
  ratingsTotal: string;
  ratingBreakdown: RatingBreakdown[];
  activeKb: string;
  dateLabel: string;
  messages: Message[];
}

/** KPI-Kennzahlen des Bots (Mini-Dashboard-Kopf). */
export interface DashboardStats {
  gespraecheHeute: number;
  gespraecheGesamt: number;
  offen: number;
  antwortzeit: string;
  bewertung: number;
}

/** Häufigste Fragen (Top-Fragen-Panel). */
export interface TopQuestion {
  text: string;
  count: number;
}

export const DASHBOARD_STATS: DashboardStats = {
  gespraecheHeute: 8,
  gespraecheGesamt: 847,
  offen: 3,
  antwortzeit: "1.2s",
  bewertung: 4.7,
};

export const TOP_QUESTIONS: TopQuestion[] = [
  { text: "Was ist die JLU?", count: 184 },
  { text: "Studiengänge", count: 142 },
  { text: "Bewerbung", count: 98 },
];

// Badge-Töne je Status (gerendert mit <Badge tone={...}> aus dem Design-System).
export const STATUS_TONES: Record<ConversationStatus, "primary" | "secondary" | "success"> = {
  Offen: "primary",
  Neu: "secondary",
  Gelöst: "success",
};

const DEFAULT_BREAKDOWN: RatingBreakdown[] = [
  { stars: 5, percent: 72 },
  { stars: 4, percent: 18 },
  { stars: 3, percent: 6 },
  { stars: 2, percent: 3 },
  { stars: 1, percent: 1 },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "conv_001",
    initials: "MM",
    name: "Max Mustermann",
    email: "max.mustermann@stud.uni-giessen.de",
    time: "14:32",
    preview: "Was ist die JLU Gießen?",
    status: "Offen",
    online: true,
    channel: "public",
    language: "Deutsch (DE)",
    source: "uni-giessen.de",
    firstSession: "03.06.2026",
    rating: 4.6,
    ratingsTotal: "1.204",
    ratingBreakdown: DEFAULT_BREAKDOWN,
    activeKb: "jlu-public-2024",
    dateLabel: "Heute, 5. Juni 2026",
    messages: [
      {
        from: "assistant",
        author: "JLU Assistent",
        time: "14:30",
        text: "Hallo! Ich bin der Assistent der JLU Gießen. Wie kann ich Ihnen helfen?",
      },
      {
        from: "user",
        author: "Max Mustermann",
        time: "14:31",
        text: "Was ist die JLU Gießen?",
      },
      {
        from: "assistant",
        author: "JLU Assistent",
        time: "14:32",
        text: "Die Justus-Liebig-Universität Gießen (JLU) ist eine der ältesten Universitäten Deutschlands, gegründet 1607. Mit über 26.000 Studierenden bietet sie ein breites Spektrum an Studiengängen in Natur-, Geistes-, Sozial- und Rechtswissenschaften sowie Medizin und Agrarwissenschaften.",
        sources: [
          { label: "uni-giessen.de/about", icon: Link },
          { label: "Geschichte der JLU", icon: FileText },
        ],
      },
    ],
  },
  {
    id: "conv_002",
    initials: "AS",
    name: "Anna Schmidt",
    email: "anna.schmidt@stud.uni-giessen.de",
    time: "13:15",
    preview: "Wie bewerbe ich mich?",
    status: "Neu",
    online: true,
    channel: "public",
    language: "Deutsch (DE)",
    source: "uni-giessen.de",
    firstSession: "05.06.2026",
    rating: 4.4,
    ratingsTotal: "1.204",
    ratingBreakdown: DEFAULT_BREAKDOWN,
    activeKb: "jlu-public-2024",
    dateLabel: "Heute, 5. Juni 2026",
    messages: [
      {
        from: "assistant",
        author: "JLU Assistent",
        time: "13:14",
        text: "Hallo! Ich bin der Assistent der JLU Gießen. Wie kann ich Ihnen helfen?",
      },
      {
        from: "user",
        author: "Anna Schmidt",
        time: "13:15",
        text: "Wie bewerbe ich mich für ein Studium?",
      },
      {
        from: "assistant",
        author: "JLU Assistent",
        time: "13:15",
        text: "Die Bewerbung erfolgt online über das Bewerbungsportal der JLU. Für zulassungsbeschränkte Fächer läuft die Bewerbung über hochschulstart.de, für zulassungsfreie Fächer direkt über das JLU-Portal.",
        sources: [{ label: "uni-giessen.de/bewerbung", icon: Link }],
      },
    ],
  },
  {
    id: "conv_003",
    initials: "TW",
    name: "Thomas Weber",
    email: "thomas.weber@stud.uni-giessen.de",
    time: "11:04",
    preview: "Welche Studiengänge gibt es?",
    status: "Gelöst",
    online: false,
    channel: "internal",
    language: "Deutsch (DE)",
    source: "uni-giessen.de",
    firstSession: "01.06.2026",
    rating: 4.8,
    ratingsTotal: "1.204",
    ratingBreakdown: DEFAULT_BREAKDOWN,
    activeKb: "jlu-internal-2024",
    dateLabel: "Heute, 5. Juni 2026",
    messages: [
      {
        from: "user",
        author: "Thomas Weber",
        time: "11:04",
        text: "Welche Studiengänge gibt es?",
      },
      {
        from: "assistant",
        author: "JLU Assistent",
        time: "11:04",
        text: "Die JLU bietet über 100 Studiengänge in elf Fachbereichen an – von Medizin und Rechtswissenschaft über Agrarwissenschaften bis zu Geistes- und Naturwissenschaften.",
        sources: [{ label: "uni-giessen.de/studienangebot", icon: FileText }],
      },
    ],
  },
];
