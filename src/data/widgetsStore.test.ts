import { beforeEach, describe, expect, it } from "vitest";
import {
  createDefaultConfig,
  fetchPublicConfig,
  fetchWidgets,
  saveWidget,
} from "./widgetsStore";
import type { Widget } from "../types/widget";

const STORAGE_KEY = "chatbotadmin.widgets";

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
  localStorage.clear();
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

describe("fetchWidgets – Migration von Altdaten", () => {
  it("übernimmt das alte Feld kbId in knowledgeBaseId", async () => {
    // Altdaten: knowledgeBaseId fehlt, stattdessen liegt kbId vor.
    const legacy = { ...makeWidget(), knowledgeBaseId: undefined, kbId: "kb-legacy" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]));

    const widgets = await fetchWidgets();
    expect(widgets[0].knowledgeBaseId).toBe("kb-legacy");
  });

  it("setzt knowledgeBaseId auf \"\" statt undefined, wenn beides fehlt", async () => {
    const legacy = { ...makeWidget(), knowledgeBaseId: undefined };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacy]));

    const widgets = await fetchWidgets();
    expect(widgets[0].knowledgeBaseId).toBe("");
  });

  it("ergänzt fehlende config-Felder mit den Defaults", async () => {
    const partial = { ...makeWidget(), config: { title: "Nur Titel" } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([partial]));

    const widgets = await fetchWidgets();
    expect(widgets[0].config.title).toBe("Nur Titel");
    // Nicht gespeicherte Felder kommen aus createDefaultConfig().
    expect(widgets[0].config.maxTokensPerAnswer).toBe(2000);
    expect(widgets[0].config.saveHistory).toBe(true);
  });

  it("fällt bei kaputtem JSON nicht um", async () => {
    localStorage.setItem(STORAGE_KEY, "{ not valid json");
    await expect(fetchWidgets()).resolves.toBeInstanceOf(Array);
  });
});

describe("saveWidget", () => {
  beforeEach(() => {
    // Leeres Array, damit fetchWidgets nicht die Initialdaten liefert.
    localStorage.setItem(STORAGE_KEY, "[]");
  });

  it("legt ein neues Widget an", async () => {
    await saveWidget(makeWidget({ id: "new-1", name: "Neu" }));
    const widgets = await fetchWidgets();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].id).toBe("new-1");
  });

  it("aktualisiert ein bestehendes Widget, ohne zu duplizieren", async () => {
    await saveWidget(makeWidget({ id: "w1", name: "Alt" }));
    await saveWidget(makeWidget({ id: "w1", name: "Neu" }));

    const widgets = await fetchWidgets();
    expect(widgets).toHaveLength(1);
    expect(widgets[0].name).toBe("Neu");
  });
});

describe("fetchPublicConfig", () => {
  beforeEach(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([makeWidget({ id: "pub-1", knowledgeBaseId: "kb-9" })]),
    );
  });

  it("liefert die öffentliche Konfiguration eines vorhandenen Widgets", async () => {
    const config = await fetchPublicConfig("pub-1");
    expect(config).not.toBeNull();
    expect(config?.knowledgeBaseId).toBe("kb-9");
    expect(config?.title).toBe(createDefaultConfig().title);
  });

  it("liefert null für ein unbekanntes Widget", async () => {
    await expect(fetchPublicConfig("gibt-es-nicht")).resolves.toBeNull();
  });
});
