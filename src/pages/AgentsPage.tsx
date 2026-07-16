import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@ki4jlu/design-system";
import { Icon } from "../components/Icon";
import { agentUsageByWidgets, fetchAgents } from "../data/agentsStore";
import { fetchModels } from "../data/models";
import { fetchWidgets } from "../data/widgetsStore";
import type { Agent } from "../types/agent";

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents()
      .then((a) => {
        setAgents(a);
        setLoadError(null);
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : "Unbekannter Fehler"));

    // Nutzung je Agent aus den Konnektoren (Widgets) ableiten.
    fetchWidgets()
      .then((widgets) => setUsage(agentUsageByWidgets(widgets)))
      .catch(() => setUsage({}));

    // Modell-IDs auf Klarnamen auflösen (Fehlschlag unkritisch → dann greift die ID).
    fetchModels()
      .then((models) => {
        const map: Record<string, string> = {};
        for (const m of models) if (m.name) map[m.id] = m.name;
        setModelNames(map);
      })
      .catch(() => setModelNames({}));
  }, []);

  const sorted = [...agents].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="flex-grow p-gutter space-y-stack-lg max-w-container-max mx-auto w-full">
      <p className="text-sm text-on-surface-variant max-w-prose">
        Agenten sind die wiederverwendbare <b className="text-on-surface">Denkschicht</b> (Ebene 1): Modell,
        System-Prompt und Regeln. Ein Agent wird einmal definiert und von beliebig vielen Konnektoren verwendet.
      </p>

      {loadError ? (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          Agenten konnten nicht geladen werden: {loadError}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <h2 className="font-headline-md text-headline-md text-on-surface">Ihre Agenten</h2>
        <p className="text-on-surface-variant font-body-base text-sm">{sorted.length} Agenten</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {sorted.map((agent) => {
          const used = usage[agent.id] ?? 0;
          const activeRules = agent.rules.filter((r) => r.enabled && r.text.trim()).length;
          return (
            <Card key={agent.id} className="p-4 hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon name="psychology" className="text-primary" />
                </div>
                {used > 0 ? (
                  <span className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-label-sm font-bold">
                    <Icon name="link" className="text-[14px]" />
                    {used} Konnektor{used === 1 ? "" : "en"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full text-label-sm font-bold">
                    Standalone
                  </span>
                )}
              </div>

              <div className="mb-3">
                <h4 className="font-headline-md text-base font-bold truncate">{agent.name || "(ohne Namen)"}</h4>
                <div className="flex items-center gap-2 text-on-surface-variant mt-1">
                  <Icon name="smart_toy" className="text-sm" />
                  <span className="font-label-sm text-xs truncate">{modelNames[agent.model] || agent.model || "kein Modell"}</span>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 my-3" />

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface-variant truncate">Regeln</span>
                  <span className="font-semibold text-sm truncate">{activeRules} aktiv</span>
                </div>
                <div className="flex flex-col min-w-0 border-l border-outline-variant/30 pl-2">
                  <span className="text-xs text-on-surface-variant truncate">Max. Tokens</span>
                  <span className="font-semibold text-sm truncate">{agent.maxTokens}</span>
                </div>
              </div>

              <Link
                to={`/agents/${agent.id}`}
                className="mt-auto flex items-center justify-center gap-2 px-3 py-2 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors"
              >
                <Icon name="edit" className="text-[16px]" />
                Bearbeiten
              </Link>
            </Card>
          );
        })}

        {/* Neuer Agent */}
        <Link
          to="/agents/new"
          className="border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer group bg-surface-container-low/50"
        >
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Icon name="add" className="text-[28px]" />
          </div>
          <span className="font-headline-md text-base font-bold">Agent hinzufügen</span>
          <p className="text-xs mt-1 opacity-70 text-center">Neue Denkschicht anlegen</p>
        </Link>
      </div>
    </main>
  );
}
