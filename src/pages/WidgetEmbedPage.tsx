import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, CodeBlock } from "@ki4jlu/design-system";
import { Card } from "@ki4jlu/design-system";
import { Input } from "@ki4jlu/design-system";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  CircleCheck,
  CirclePause,
  Copy,
  ExternalLink,
  TriangleAlert,
  LoaderCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import { fetchModels } from "../data/models";
import { fetchWidgets } from "../data/widgetsStore";
import { resolveWidgetPortalUrl } from "../lib/widgetPortal";
import type { Widget } from "../types/widget";

const WIDGET_BASE_URL = import.meta.env.VITE_WIDGET_BASE_URL || "https://ki-chat.uni-giessen.de";

function buildLoaderCode(): string {
  return `<!-- In Plone Theme → Resource Registry <head> -->
<script
  src="${WIDGET_BASE_URL}/widget.js"
  defer></script>`;
}

function buildPlaceholderCode(widget: Widget): string {
  return `<!-- In Plone Seite → Bearbeiten → HTML-Ansicht -->
<div class="chatbot-widget"
  data-widget-id="${widget.id}"
  data-kb="${widget.knowledgeBaseId || "kb-id"}"
  data-routing="${widget.routing || "public"}-widget"
  data-lang="de"></div>`;
}

// ── kleine Bausteine ───────────────────────────────────────────────────────

type Tone = "done" | "active" | "pending";

const stepBadge: Record<Tone, string> = {
  done: "bg-surface-container-high text-on-surface-variant",
  active: "bg-primary text-on-primary",
  pending: "bg-surface-container-high text-on-surface-variant",
};

const statusBadge: Record<Tone, { label: string; className: string }> = {
  done: { label: "Erledigt", className: "bg-success-container text-on-success-container" },
  active: { label: "Aktiv", className: "bg-primary/10 text-primary" },
  pending: { label: "Ausstehend", className: "bg-error/10 text-error" },
};

function StepCard({
  step,
  tone,
  title,
  subtitle,
  tags,
  accent,
  children,
}: {
  step: number;
  tone: Tone;
  title: string;
  subtitle: string;
  tags?: { label: string; outline?: boolean }[];
  accent?: boolean;
  children: ReactNode;
}) {
  const status = statusBadge[tone];
  return (
    <Card
      className={`p-6 space-y-stack-sm ${
        accent ? "border-l-4 border-l-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${stepBadge[tone]}`}
          >
            {step}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-headline-md text-base font-bold">{title}</h3>
              {tags?.map((t) => (
                <span
                  key={t.label}
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                    t.outline
                      ? "border border-primary/50 text-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span
          className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      {children}
    </Card>
  );
}

// ── Seite ────────────────────────────────────────────────────────────────

export function WidgetEmbedPage() {
  const { id } = useParams<{ id: string }>();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [kbNames, setKbNames] = useState<Record<string, string>>({});
  // IDs aller vom Backend gemeldeten Knowledge-Bases — um zu prüfen, ob die dem
  // Widget zugewiesene KB tatsächlich existiert.
  const [kbIds, setKbIds] = useState<Set<string>>(new Set());
  // Status des /api/models-Abrufs = echter Erreichbarkeits-Check des Backends.
  const [apiStatus, setApiStatus] = useState<"loading" | "ok" | "error">("loading");
  // Erreichbarkeit der Standalone-Testseite (/w/:id). Sie wird vom selben SPA auf
  // DIESEM Origin (window.location.origin) ausgeliefert — same-origin, daher ein
  // lesbarer HTTP-Status. So sieht die Testseite dasselbe localStorage und dieselbe
  // Session wie das Admin-UI (auf VITE_WIDGET_BASE_URL wäre beides leer/ungültig).
  const [siteStatus, setSiteStatus] = useState<"loading" | "ok" | "error">("loading");
  const [copied, setCopied] = useState<"url" | null>(null);

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    fetchWidgets()
      .then((widgets) => {
        if (ignore) return;
        const found = widgets.find((w) => w.id === id) ?? null;
        setWidget(found);
        setNotFound(!found);
      })
      .catch(() => !ignore && setNotFound(true));

    fetchModels()
      .then((models) => {
        if (ignore) return;
        const map: Record<string, string> = {};
        const ids = new Set<string>();
        for (const m of models) {
          ids.add(m.id);
          if (m.name) map[m.id] = m.name;
        }
        setKbNames(map);
        setKbIds(ids);
        setApiStatus("ok");
      })
      .catch(() => {
        if (!ignore) setApiStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Standalone-Testseite anpingen (same-origin, mit 5-s-Timeout). Läuft separat vom
  // Bestands-Abruf, weil sie selbst abbrechen können muss.
  useEffect(() => {
    if (!id) return;
    let ignore = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    fetch(`${window.location.origin}/w/${id}`, {
      method: "GET",
      signal: controller.signal,
    })
      .then((res) => {
        if (!ignore) setSiteStatus(res.ok ? "ok" : "error");
      })
      .catch(() => {
        if (!ignore) setSiteStatus("error");
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [id]);

  const copy = async (text: string, key: "url") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* Clipboard nicht verfügbar – ignorieren */
    }
  };

  const header = (
    <div className="flex items-center gap-3 mb-2">
      <Button asChild variant="outline" size="icon">
        <Link to="/" aria-label="Zurück zur Übersicht">
          <ArrowLeft className="text-[20px]" width="1em" height="1em" aria-hidden />
        </Link>
      </Button>
      <div className="min-w-0">
        <h1 className="font-headline-md text-headline-md text-on-surface">Einbetten</h1>
        <p className="text-sm text-on-surface-variant truncate">
          {widget ? widget.name || widget.id : "…"}
        </p>
      </div>
    </div>
  );

  if (notFound) {
    return (
      <main className="flex-grow p-gutter max-w-3xl mx-auto w-full space-y-stack-lg">
        {header}
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          Widget „{id}" wurde nicht gefunden.
        </div>
      </main>
    );
  }

  if (!widget) {
    return (
      <main className="flex-grow p-gutter max-w-3xl mx-auto w-full space-y-stack-lg">
        {header}
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <LoaderCircle className="text-[18px] animate-spin" width="1em" height="1em" aria-hidden />
          Wird geladen…
        </div>
      </main>
    );
  }

  const directUrl = `${WIDGET_BASE_URL}/w/${widget.id}`;
  // Die Testseite öffnet das Cross-Origin-Widget-Portal (:8082 lokal, :6443 in
  // Prod) und lädt via ?widget=<id> genau dieses Widget. Die Konfiguration kommt
  // jetzt aus dem Backend (nicht mehr aus dem localStorage), daher zeigt jeder
  // Origin dieselben Daten — und das Portal übt den echten Einbettungspfad.
  const testUrl = resolveWidgetPortalUrl(widget.id);
  const kbDisplay = kbNames[widget.knowledgeBaseId] || widget.knowledgeBaseId || "—";
  const kbAssigned = widget.knowledgeBaseId.trim() !== "";

  // Wiederverwendbarer Status-Chip.
  const chip = (tone: "success" | "warning" | "error" | "muted" | "loading", icon: LucideIcon, text: string): ReactNode => {
    const ChipIcon = icon;
    const badgeTone = tone === "muted" || tone === "loading" ? "neutral" : tone;
    return (
      <Badge appearance="text" tone={badgeTone}>
        <ChipIcon className={`text-[16px] ${tone === "loading" ? "animate-spin" : ""}`} width="1em" height="1em" aria-hidden />
        {text}
      </Badge>
    );
  };

  // Echte, aus dem tatsächlichen Zustand abgeleitete Checks:
  //  • Widget-Status  → widget.status (aktiv/pausiert)
  //  • Knowledge-Base → ob eine KB zugewiesen ist und sie in /api/models existiert
  //  • Backend        → ob der /api/models-Abruf erfolgreich war
  const kbNode: ReactNode =
    !kbAssigned ? chip("error", CircleAlert, "Keine KB zugewiesen")
    : apiStatus === "loading" ? chip("loading", LoaderCircle, "Wird geprüft…")
    : apiStatus === "ok" && !kbIds.has(widget.knowledgeBaseId)
      ? chip("warning", TriangleAlert, `${kbDisplay} — nicht gefunden`)
    : chip("success", CircleCheck, kbDisplay);

  const checks: { label: string; node: ReactNode }[] = [
    {
      label: "Widget-Status",
      node: widget.status === "active"
        ? chip("success", CircleCheck, "Aktiv")
        : chip("warning", CirclePause, "Pausiert"),
    },
    {
      label: "Knowledge-Base",
      node: kbNode,
    },
    {
      label: "Backend erreichbar",
      node:
        apiStatus === "loading" ? chip("loading", LoaderCircle, "Wird geprüft…")
        : apiStatus === "ok" ? chip("success", CircleCheck, "OK")
        : chip("error", CircleAlert, "Nicht erreichbar"),
    },
    {
      label: "Testseite erreichbar",
      node:
        siteStatus === "loading" ? chip("loading", LoaderCircle, "Wird geprüft…")
        : siteStatus === "ok" ? chip("success", CircleCheck, "Erreichbar")
        : chip("error", CircleAlert, "Nicht erreichbar"),
    },
  ];

  // Gesamt-Status der Karte aus den echten Checks: alles grün → „Erledigt",
  // während der Prüfung → „Aktiv", sonst „Ausstehend".
  const allHealthy =
    apiStatus === "ok" &&
    siteStatus === "ok" &&
    widget.status === "active" &&
    kbAssigned &&
    kbIds.has(widget.knowledgeBaseId);
  const step3Tone: Tone =
    apiStatus === "loading" || siteStatus === "loading" ? "active" : allHealthy ? "done" : "pending";

  return (
    <main className="flex-grow p-gutter max-w-3xl mx-auto w-full space-y-stack-lg">
      {header}

      {/* Schritt 1 — Globaler Script-Loader */}
      <StepCard
        step={1}
        tone="done"
        title="Schritt 1 — Globaler Script-Loader"
        subtitle="Einmalig im Plone-Theme einbinden"
        tags={[{ label: "Admin" }, { label: "Einmalig" }]}
      >
        <CodeBlock code={buildLoaderCode()} />
        <p className="text-xs text-on-surface-variant italic">
          Dieser Code wird nur einmal global eingebunden — nicht pro Seite.
        </p>
      </StepCard>

      {/* Schritt 2 — Widget-Platzhalter pro Seite */}
      <StepCard
        step={2}
        tone="active"
        accent
        title="Schritt 2 — Widget-Platzhalter pro Seite"
        subtitle="Im Seiteninhalt einfügen"
        tags={[{ label: "Editor" }, { label: "Pro Seite", outline: true }]}
      >
        <CodeBlock code={buildPlaceholderCode(widget)} />

        <div className="flex flex-col gap-1 pt-1">
          <label className="font-label-sm text-xs uppercase tracking-wide text-on-surface-variant">
            Direkte URL
          </label>
          <div className="flex items-center gap-2">
            <Input readOnly value={directUrl} />
            <Button asChild variant="outline" size="icon" className="shrink-0">
              <a
                href={directUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="URL öffnen"
              >
                <ExternalLink className="text-[18px]" width="1em" height="1em" aria-hidden />
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => copy(directUrl, "url")}
              aria-label="URL kopieren"
              className="shrink-0"
            >
              {copied === "url" ? (
                <Check className="text-[18px]" width="1em" height="1em" aria-hidden />
              ) : (
                <Copy className="text-[18px]" width="1em" height="1em" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </StepCard>

      {/* Schritt 3 — Widget testen */}
      <StepCard
        step={3}
        tone={step3Tone}
        title="Schritt 3 — Widget testen"
        subtitle="Status von Widget, Knowledge-Base und Backend"
      >
        <div className="pt-1">
          {checks.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between py-2.5 border-b border-outline-variant/50 last:border-0"
            >
              <span className="text-sm text-on-surface-variant">{c.label}</span>
              <span className="text-sm font-semibold">{c.node}</span>
            </div>
          ))}
        </div>

        <Button asChild variant="ghost" className="mt-2 w-full">
          <a href={testUrl} target="_blank" rel="noopener noreferrer">
            <Send className="text-[18px]" width="1em" height="1em" aria-hidden />
            Testseite öffnen
          </a>
        </Button>
      </StepCard>
    </main>
  );
}
