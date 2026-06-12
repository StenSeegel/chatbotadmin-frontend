export type WidgetStatus = "active" | "paused";

export type WidgetAccent = "primary" | "secondary";

export interface WidgetStats {
  conversations: number;
  rating: number;
}

export interface Widget {
  id: string;
  name: string;
  kbId: string;
  routing: string;
  status: WidgetStatus;
  icon: string;
  accent: WidgetAccent;
  stats: WidgetStats;
}
