import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ICON_OPTIONS, WidgetConfigView } from "../components/WidgetConfigView";
import { createDefaultConfig, loadWidgets, saveWidgets } from "../data/widgetsStore";
import type { Widget, WidgetAccent } from "../types/widget";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "widget-id";
}

function buildEmbedCode(widgetId: string, kbId: string, routing: string): string {
  return `<!-- ChatBot Widget -->
<div id="chatbot-root"></div>
<script
  src="https://chat.uni-giessen.de/widget.js"
  data-widget-id="${widgetId || "widget-id"}"
  data-kb="${kbId || "kb-id"}"
  data-routing="${routing || "public"}-widget"
  data-lang="de"
  defer
></script>`;
}

function buildDirectUrl(widgetId: string): string {
  return `https://chat.uni-giessen.de/w/${widgetId || "widget-id"}`;
}

export function WidgetConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);

  const [widget, setWidget] = useState<Widget>(() => {
    if (isNew) {
      return {
        id: "",
        name: "",
        kbId: "",
        routing: "public",
        status: "active",
        icon: ICON_OPTIONS[0],
        accent: "primary" as WidgetAccent,
        stats: { conversations: 0, rating: 0 },
        config: createDefaultConfig(),
      };
    }
    return (
      widgets.find((w) => w.id === id) ?? {
        id: id ?? "",
        name: "",
        kbId: "",
        routing: "public",
        status: "active",
        icon: ICON_OPTIONS[0],
        accent: "primary" as WidgetAccent,
        stats: { conversations: 0, rating: 0 },
        config: createDefaultConfig(),
      }
    );
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  const update = <K extends keyof Widget>(key: K, value: Widget[K]) => {
    setWidget((current) => ({ ...current, [key]: value }));
  };

  const updateConfig = <K extends keyof Widget["config"]>(key: K, value: Widget["config"][K]) => {
    setWidget((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  };

  const handleSave = () => {
    if (isNew) {
      if (!widget.name.trim() || !widget.kbId.trim()) return;
      const newId = slugify(widget.name) || crypto.randomUUID().slice(0, 8);
      const newWidget: Widget = { ...widget, id: newId };
      const updated = [...widgets, newWidget];
      saveWidgets(updated);
      setWidgets(updated);
    } else {
      const updated = widgets.map((w) => (w.id === widget.id ? widget : w));
      saveWidgets(updated);
      setWidgets(updated);
    }
    navigate("/");
  };

  const handleCopy = async (text: string, kind: "code" | "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  const previewId = isNew ? slugify(widget.name) : widget.id;

  return (
    <WidgetConfigView
      widget={widget}
      isNew={isNew}
      isActive={widget.status === "active"}
      showApiKey={showApiKey}
      copied={copied}
      embedCode={buildEmbedCode(previewId, widget.kbId, widget.routing)}
      directUrl={buildDirectUrl(previewId)}
      onSave={handleSave}
      onCancel={() => navigate("/")}
      onToggleStatus={() => update("status", widget.status === "active" ? "paused" : "active")}
      onToggleShowApiKey={() => setShowApiKey((v) => !v)}
      onRegenerateApiKey={() => {
        updateConfig("apiKey", `sk-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`);
        setShowApiKey(true);
      }}
      onCopy={handleCopy}
      onUpdate={update}
      onUpdateConfig={updateConfig}
    />
  );
}
