// Type declarations for the shared history store (consumed by vite.config.ts).
// The runtime implementation lives in history-store.mjs.

export interface HistoryEntry {
  at: string;
  widgetId: string;
  question: string;
  answer: string;
  finishReason: string | null;
}

export function appendHistory(entry: Omit<HistoryEntry, "at">): HistoryEntry;
