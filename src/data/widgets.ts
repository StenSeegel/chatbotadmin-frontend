import type { Widget } from "../types/widget";

export const widgets: Widget[] = [
  {
    id: "support-bot",
    name: "Support Bot",
    kbId: "jlu-public-2024",
    routing: "public",
    status: "active",
    icon: "language",
    accent: "primary",
    stats: { conversations: 1204, rating: 4.7 },
  },
  {
    id: "sales-tracker",
    name: "Sales Tracker",
    kbId: "sales-internal-v2",
    routing: "internal",
    status: "paused",
    icon: "analytics",
    accent: "secondary",
    stats: { conversations: 389, rating: 4.5 },
  },
];
