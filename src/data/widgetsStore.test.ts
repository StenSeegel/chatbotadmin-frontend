import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../auth/api";
import {
  createDefaultConfig,
  fetchPublicConfig,
  fetchWidgets,
  saveWidget,
} from "./widgetsStore";
import type { Widget } from "../types/widget";

// Der Store spricht das Backend ausschließlich über apiFetch an – hier gemockt,
// damit die Tests kein echtes Netzwerk/Backend brauchen.
vi.mock("../auth/api", () => ({ apiFetch: vi.fn() }));
const mockApiFetch = vi.mocked(apiFetch);

// Baut eine minimale Response, wie sie apiFetch zurückgibt (nur die von den
// Store-Funktionen genutzten Felder: ok, status, json()).
function jsonResponse(body: unknown, init: { status?: number } = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function makeWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: "w1",
    name: "Test Widget",
    knowledgeBaseId: "kb-1",
    routing: "public",
    status: "active",
    icon: "Globe",
    accent: "primary",
    stats: { conversations: 0, rating: 0 },
    config: createDefaultConfig(),
    ...overrides,
  };
}

beforeEach(() => {
  mockApiFetch.mockReset();
});

describe("createDefaultConfig", () => {
  it("liefert die aktuellen Defaults ohne die entfernten Felder", () => {
    const config = createDefaultConfig();
    expect(config.maxTokensPerAnswer).toBe(2000);
    expect(config.saveHistory).toBe(true);
    expect(config.feedbackButtons).toBe(true);
    // apiKey/model/dialogDepth wurden aus WidgetConfig entfernt.
    expect("apiKey" in config).toBe(false);
    expect("model" in config).toBe(false);
  });
});

describe("fetchWidgets", () => {
  it("ruft GET /api/widgets ab und liefert die Widget-Liste", async () => {
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ widgets: [makeWidget({ id: "a" })] }));

    const widgets = await fetchWidgets();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/widgets");
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe("a");
  });

  it("übernimmt das alte Feld kbId in knowledgeBaseId", async () => {
    const legacy = { ...makeWidget(), knowledgeBaseId: undefined, kbId: "kb-legacy" };
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ widgets: [legacy] }));

    const widgets = await fetchWidgets();
    expect(widgets[0].knowledgeBaseId).toBe("kb-legacy");
  });

  it("setzt knowledgeBaseId auf \"\" statt undefined, wenn beides fehlt", async () => {
    const legacy = { ...makeWidget(), knowledgeBaseId: undefined };
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ widgets: [legacy] }));

    const widgets = await fetchWidgets();
    expect(widgets[0].knowledgeBaseId).toBe("");
  });

  it("ergänzt fehlende config-Felder mit den Defaults", async () => {
    const partial = { ...makeWidget(), config: { title: "Nur Titel" } };
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ widgets: [partial] }));

    const widgets = await fetchWidgets();
    expect(widgets[0].config.title).toBe("Nur Titel");
    // Nicht gesendete Felder kommen aus createDefaultConfig().
    expect(widgets[0].config.maxTokensPerAnswer).toBe(2000);
    expect(widgets[0].config.saveHistory).toBe(true);
  });

  it("liefert ein leeres Array, wenn das Backend keine widgets-Property sendet", async () => {
    mockApiFetch.mockResolvedValueOnce(jsonResponse({}));
    await expect(fetchWidgets()).resolves.toEqual([]);
  });

  it("wirft bei einer Fehlerantwort des Backends", async () => {
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ error: "kaputt" }, { status: 500 }));
    await expect(fetchWidgets()).rejects.toThrow(/HTTP 500/);
  });
});

describe("saveWidget", () => {
  it("sendet PUT an /api/widgets/:id mit dem Widget als Body", async () => {
    const widget = makeWidget({ id: "new-1", name: "Neu" });
    mockApiFetch.mockResolvedValueOnce(jsonResponse(widget));

    await saveWidget(widget);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [path, init] = mockApiFetch.mock.calls[0];
    expect(path).toBe("/api/widgets/new-1");
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toMatchObject({ id: "new-1", name: "Neu" });
  });

  it("kodiert die id in der URL", async () => {
    const widget = makeWidget({ id: "a/b" });
    mockApiFetch.mockResolvedValueOnce(jsonResponse(widget));

    await saveWidget(widget);
    expect(mockApiFetch.mock.calls[0][0]).toBe("/api/widgets/a%2Fb");
  });

  it("gibt das vom Backend gespeicherte Widget zurück", async () => {
    const saved = makeWidget({ id: "w1", name: "Serverwert" });
    mockApiFetch.mockResolvedValueOnce(jsonResponse(saved));

    const result = await saveWidget(makeWidget({ id: "w1", name: "Clientwert" }));
    expect(result.name).toBe("Serverwert");
  });

  it("wirft mit der Backend-Fehlermeldung bei einer Fehlerantwort", async () => {
    mockApiFetch.mockResolvedValueOnce(
      jsonResponse({ error: "Widget-id im Body muss zur URL passen." }, { status: 400 }),
    );
    await expect(saveWidget(makeWidget())).rejects.toThrow("Widget-id im Body muss zur URL passen.");
  });
});

describe("fetchPublicConfig", () => {
  it("liefert die öffentliche Konfiguration eines vorhandenen Widgets", async () => {
    mockApiFetch.mockResolvedValueOnce(
      jsonResponse({ id: "pub-1", knowledgeBaseId: "kb-9", title: "Titel" }),
    );

    const config = await fetchPublicConfig("pub-1");
    expect(mockApiFetch).toHaveBeenCalledWith("/api/widgets/pub-1");
    expect(config?.knowledgeBaseId).toBe("kb-9");
    expect(config?.title).toBe("Titel");
  });

  it("liefert null für ein unbekanntes Widget (404)", async () => {
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ error: "nicht gefunden" }, { status: 404 }));
    await expect(fetchPublicConfig("gibt-es-nicht")).resolves.toBeNull();
  });

  it("wirft bei anderen Fehlerantworten", async () => {
    mockApiFetch.mockResolvedValueOnce(jsonResponse({ error: "kaputt" }, { status: 500 }));
    await expect(fetchPublicConfig("x")).rejects.toThrow(/HTTP 500/);
  });
});
