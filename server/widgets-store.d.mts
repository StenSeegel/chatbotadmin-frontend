// Type declarations for the shared widgets store (consumed by vite.config.ts).
// The runtime implementation lives in widgets-store.mjs.

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

export function listWidgets(): unknown[];
export function getWidget(id: string): unknown | undefined;
export function upsertWidget(widget: unknown): unknown;
export function getPublicConfig(id: string): PublicWidgetConfig | undefined;
