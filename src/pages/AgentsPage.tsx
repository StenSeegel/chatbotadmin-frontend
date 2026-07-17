import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, DashboardLayout, Grid } from "@ki4jlu/design-system";
import { Bot, Brain, Link as LinkIcon, Pencil } from "lucide-react";
import { AddTile } from "../components/AddTile";
import { Alert } from "../components/Alert";
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
    <DashboardLayout
      title="Agenten"
      description={
        <>
          Agenten sind die wiederverwendbare <b className="text-on-surface">Denkschicht</b> (Ebene 1): Modell,
          System-Prompt und Regeln. Ein Agent wird einmal definiert und von beliebig vielen Konnektoren verwendet.
        </>
      }
    >
      {loadError && <Alert>Agenten konnten nicht geladen werden: {loadError}</Alert>}

      <Grid cols={4}>
        {sorted.map((agent) => {
          const used = usage[agent.id] ?? 0;
          const activeRules = agent.rules.filter((r) => r.enabled && r.text.trim()).length;
          return (
            <Card key={agent.id} className="p-4 hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Brain className="text-primary" width="1em" height="1em" aria-hidden />
                </div>
                {used > 0 ? (
                  <Badge tone="primary">
                    <LinkIcon className="text-[14px]" width="1em" height="1em" aria-hidden />
                    {used} Konnektor{used === 1 ? "" : "en"}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Standalone</Badge>
                )}
              </div>

              <div className="mb-3">
                <h4 className="font-headline-md text-base font-bold truncate">{agent.name || "(ohne Namen)"}</h4>
                <div className="flex items-center gap-2 text-on-surface-variant mt-1">
                  <Bot className="text-sm" width="1em" height="1em" aria-hidden />
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

              <Button asChild variant="outline" size="sm" className="mt-auto w-full">
                <Link to={`/agents/${agent.id}`}>
                  <Pencil className="text-[16px]" width="1em" height="1em" aria-hidden />
                  Bearbeiten
                </Link>
              </Button>
            </Card>
          );
        })}

        <AddTile to="/agents/new" label="Agent hinzufügen" hint="Neue Denkschicht anlegen" />
      </Grid>
    </DashboardLayout>
  );
}
