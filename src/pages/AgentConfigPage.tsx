import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "../components/Alert";
import { AgentEditorView } from "../components/AgentEditorView";
import { agentUsageByWidgets, createDefaultAgent, deleteAgent, fetchAgents, saveAgent } from "../data/agentsStore";
import { fetchWidgets } from "../data/widgetsStore";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { Agent } from "../types/agent";

export function AgentConfigPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const currentUser = useCurrentUser();
  const canDelete = currentUser?.role === "superadmin";

  // Neue Agenten erhalten sofort eine unveränderliche UUID (einmalig im
  // useState-Initializer), analog zu WidgetConfigPage.
  const [agent, setAgent] = useState<Agent>(() =>
    createDefaultAgent(isNew ? crypto.randomUUID() : id ?? ""),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  // Wie viele Konnektoren diesen Agenten verwenden – blockiert das Löschen.
  const [usageCount, setUsageCount] = useState(0);

  // Bestehenden Agenten laden.
  useEffect(() => {
    if (isNew) return;
    let ignore = false;
    fetchAgents()
      .then((list) => {
        if (ignore) return;
        const found = list.find((a) => a.id === id);
        if (found) setAgent(found);
      })
      .catch((err: unknown) => {
        if (!ignore) setSaveError(err instanceof Error ? err.message : "Unbekannter Fehler");
      });
    return () => {
      ignore = true;
    };
  }, [id, isNew]);

  // Nutzungszähler aus den Konnektoren ableiten (für den Lösch-Guard).
  useEffect(() => {
    if (isNew) return;
    let ignore = false;
    fetchWidgets()
      .then((widgets) => {
        if (ignore) return;
        setUsageCount(agentUsageByWidgets(widgets)[id ?? ""] ?? 0);
      })
      .catch(() => setUsageCount(0));
    return () => {
      ignore = true;
    };
  }, [id, isNew]);

  const [saved, setSaved] = useState(false);

  const update = <K extends keyof Agent>(key: K, value: Agent[K]) => {
    setSaved(false);
    setAgent((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      if (isNew && (!agent.name.trim() || !agent.model.trim())) return;
      const persisted = await saveAgent(agent);
      setAgent(persisted);
      setSaved(true);
      // Beim Anlegen auf die Bearbeiten-Route wechseln (Komponente bleibt montiert).
      if (isNew) navigate(`/agents/${persisted.id}`, { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setSaveError(null);
    try {
      await deleteAgent(agent.id);
      navigate("/agents");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    }
  };

  return (
    <>
      {saveError ? (
        <div className="mx-auto mt-4 max-w-container-max px-gutter">
          <Alert>{saveError}</Alert>
        </div>
      ) : null}
      <AgentEditorView
        agent={agent}
        isNew={isNew}
        saved={saved}
        canDelete={canDelete}
        usageCount={usageCount}
        onSave={handleSave}
        onCancel={() => navigate("/agents")}
        onDelete={handleDelete}
        onUpdate={update}
      />
    </>
  );
}
