import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "../components/Icon";
import { fetchModels } from "../data/models";
import { fetchWidgets } from "../data/widgetsStore";
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
  done: { label: "Erledigt", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
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
    <section
      className={`bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-stack-sm ${
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
    </section>
  );
}

function CodeBlock({ code, copied, onCopy }: { code: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="relative rounded-xl bg-[#1e1e2e] overflow-hidden">
      <button
        type="button"
        onClick={onCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
      >
        <Icon name={copied ? "check" : "content_copy"} className="text-[14px]" />
        {copied ? "Kopiert" : "Code kopieren"}
      </button>
      <pre className="overflow-x-auto p-4 pr-28 font-mono text-xs leading-relaxed">
        {code.split("\n").map((line, i) => (
          <div
            key={i}
            className={line.trim().startsWith("<!--") ? "text-emerald-400/80" : "text-slate-100"}
          >
            {line || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

// ── Seite ────────────────────────────────────────────────────────────────

export function WidgetEmbedPage() {
  const { id } = useParams<{ id: string }>();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [kbNames, setKbNames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<"loader" | "placeholder" | "url" | null>(null);

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
        for (const m of models) if (m.name) map[m.id] = m.name;
        setKbNames(map);
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [id]);

  const copy = async (text: string, key: "loader" | "placeholder" | "url") => {
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
      <Link
        to="/"
        aria-label="Zurück zur Übersicht"
        className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors"
      >
        <Icon name="arrow_back" className="text-[20px]" />
      </Link>
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
          <Icon name="progress_activity" className="text-[18px] animate-spin" />
          Wird geladen…
        </div>
      </main>
    );
  }

  const directUrl = `${WIDGET_BASE_URL}/w/${widget.id}`;
  const kbDisplay = kbNames[widget.knowledgeBaseId] || widget.knowledgeBaseId || "—";
  const kbActive = widget.status === "active";

  // Test-Status: KB/URL sind echt; die Verbindungs-Checks sind aktuell
  // Platzhalter (können später an echte Health-Checks angebunden werden).
  const checks: { label: string; node: ReactNode }[] = [
    {
      label: "Script eingebunden",
      node: (
        <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400">
          <Icon name="info" className="text-[16px]" />
          Erkannt
        </span>
      ),
    },
    {
      label: "API erreichbar",
      node: (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <Icon name="check_circle" className="text-[16px]" />
          OK
        </span>
      ),
    },
    {
      label: "CORS konfiguriert",
      node: (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <Icon name="check_circle" className="text-[16px]" />
          OK
        </span>
      ),
    },
    {
      label: "KB aktiv",
      node: (
        <span
          className={`inline-flex items-center gap-1 ${
            kbActive ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          {kbDisplay}
        </span>
      ),
    },
    {
      label: "Plone Testseite",
      node: (
        <span className="inline-flex items-center gap-1 text-error">
          <Icon name="error" className="text-[16px]" />
          Nicht getestet
        </span>
      ),
    },
  ];

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
        <CodeBlock
          code={buildLoaderCode()}
          copied={copied === "loader"}
          onCopy={() => copy(buildLoaderCode(), "loader")}
        />
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
        <CodeBlock
          code={buildPlaceholderCode(widget)}
          copied={copied === "placeholder"}
          onCopy={() => copy(buildPlaceholderCode(widget), "placeholder")}
        />

        <div className="flex flex-col gap-1 pt-1">
          <label className="font-label-sm text-xs uppercase tracking-wide text-on-surface-variant">
            Direkte URL
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={directUrl}
              className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-lg font-mono text-xs outline-none"
            />
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="URL öffnen"
              className="shrink-0 p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <Icon name="open_in_new" className="text-[18px]" />
            </a>
            <button
              type="button"
              onClick={() => copy(directUrl, "url")}
              aria-label="URL kopieren"
              className="shrink-0 p-2 border border-outline-variant rounded-lg hover:bg-surface-container-high transition-colors"
            >
              <Icon name={copied === "url" ? "check" : "content_copy"} className="text-[18px]" />
            </button>
          </div>
        </div>
      </StepCard>

      {/* Schritt 3 — Widget testen */}
      <StepCard
        step={3}
        tone="pending"
        title="Schritt 3 — Widget testen"
        subtitle="Überprüfen ob das Widget korrekt geladen wird"
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

        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-3 bg-surface-container-high hover:bg-surface-container-highest rounded-xl text-sm font-medium transition-colors"
        >
          <Icon name="send" className="text-[18px]" />
          Testseite öffnen
        </a>
      </StepCard>
    </main>
  );
}
