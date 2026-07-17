import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, ChartColumn, ChevronDown, Waypoints } from "lucide-react";
import { Button, NavItem, Stack, cn } from "@ki4jlu/design-system";
import { WidgetIcon } from "./WidgetIcon";
import { fetchAgents } from "../data/agentsStore";
import { fetchWidgets } from "../data/widgetsStore";
import type { Agent } from "../types/agent";
import type { Widget } from "../types/widget";

// Navigationsinhalt der App-Shell — AppShellLayout rendert ihn in der
// Desktop-Sidebar UND im Mobile-Drawer. Eltern-Zeilen sind echte Links,
// denn der Drawer schließt nur bei Link-Klicks; auf-/zugeklappt wird über
// den separaten Chevron-Button (entflechtet Navigieren und Umschalten).

interface NavSectionProps {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function NavSection({ to, icon, label, active, open, onToggle, children }: NavSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <NavItem asChild active={active} className="min-w-0 flex-1">
          <Link to={to}>
            {icon}
            <span>{label}</span>
          </Link>
        </NavItem>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-label={`Unterpunkte von ${label} ${open ? "einklappen" : "ausklappen"}`}
          onClick={onToggle}
        >
          <ChevronDown
            className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
            width="1em"
            height="1em"
            aria-hidden
          />
        </Button>
      </div>
      {open && (
        <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">{children}</div>
      )}
    </div>
  );
}

export function AppSidebarNav() {
  const location = useLocation();

  const [agents, setAgents] = useState<Agent[]>([]);
  const agentsActive = location.pathname.startsWith("/agents");
  const [agentsOpen, setAgentsOpen] = useState(agentsActive);

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const widgetsActive = location.pathname === "/" || location.pathname.startsWith("/widgets");
  const [widgetsOpen, setWidgetsOpen] = useState(widgetsActive);

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
    fetchWidgets()
      .then(setWidgets)
      .catch(() => setWidgets([]));
  }, []);

  const statistikenActive = location.pathname.startsWith("/statistiken");

  return (
    <Stack gap="sm">
      <NavSection
        to="/agents"
        icon={<Brain width="1em" height="1em" aria-hidden />}
        label="Agenten"
        active={agentsActive}
        open={agentsOpen}
        onToggle={() => setAgentsOpen((v) => !v)}
      >
        {agents.map((agent) => (
          <NavItem key={agent.id} asChild level="sub" active={location.pathname === `/agents/${agent.id}`}>
            <Link to={`/agents/${agent.id}`}>
              <Brain className="text-[18px]" width="1em" height="1em" aria-hidden />
              <span className="truncate">{agent.name || "(ohne Namen)"}</span>
            </Link>
          </NavItem>
        ))}
        {agents.length === 0 && (
          <span className="px-3 py-2 text-xs text-on-surface-variant/60 italic">Noch keine Agenten</span>
        )}
      </NavSection>

      <NavSection
        to="/"
        icon={<Waypoints width="1em" height="1em" aria-hidden />}
        label="Konnektoren"
        active={widgetsActive}
        open={widgetsOpen}
        onToggle={() => setWidgetsOpen((v) => !v)}
      >
        {widgets.map((widget) => (
          <NavItem
            key={widget.id}
            asChild
            level="sub"
            active={location.pathname === `/widgets/${widget.id}/gespraeche`}
          >
            <Link to={`/widgets/${widget.id}/gespraeche`}>
              <WidgetIcon name={widget.icon} size={18} className="shrink-0" />
              <span className="truncate">{widget.name}</span>
            </Link>
          </NavItem>
        ))}
      </NavSection>

      <NavItem asChild active={statistikenActive}>
        <Link to="/statistiken">
          <ChartColumn width="1em" height="1em" aria-hidden />
          <span>Statistiken</span>
        </Link>
      </NavItem>
    </Stack>
  );
}
