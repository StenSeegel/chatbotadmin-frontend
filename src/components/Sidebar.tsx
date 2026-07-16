import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Icon } from "./Icon";
import { WidgetIcon } from "./WidgetIcon";
import { Button, ThemeToggle } from "@ki4jlu/design-system";
import { fetchWidgets } from "../data/widgetsStore";
import { fetchAgents } from "../data/agentsStore";
import { resolveWidgetPortalUrl } from "../lib/widgetPortal";
import type { Widget } from "../types/widget";
import type { Agent } from "../types/agent";

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const widgetPortalUrl = resolveWidgetPortalUrl();

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const widgetsActive = location.pathname === "/" || location.pathname.startsWith("/widgets");
  const [widgetsOpen, setWidgetsOpen] = useState(widgetsActive);

  const [agents, setAgents] = useState<Agent[]>([]);
  const agentsActive = location.pathname.startsWith("/agents");
  const [agentsOpen, setAgentsOpen] = useState(agentsActive);

  useEffect(() => {
    fetchWidgets()
      .then(setWidgets)
      .catch(() => setWidgets([]));
    fetchAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  const statistikenActive = location.pathname.startsWith("/statistiken");

  // hover:bg-primary keeps the active row's bg stable (Button's ghost variant adds hover:bg-surface-container-high)
  const parentClass = (active: boolean) =>
    active
      ? "flex items-center gap-4 px-4 py-3 bg-primary hover:bg-primary text-on-primary rounded-full transition-all duration-200 ease-in-out"
      : "flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-secondary-container rounded-full transition-all duration-200 ease-in-out";

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 p-4 bg-surface-container-low border-r border-outline-variant z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Icon name="smart_toy" className="text-primary" style={{ fontSize: 32 }} />
        <h1 className="text-headline-md font-bold text-primary">ChatBot Admin</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              navigate("/agents");
              setAgentsOpen((v) => !v);
            }}
            className={`${parentClass(agentsActive)} justify-start w-full font-body-base text-body-base`}
          >
            <Icon name="psychology" />
            <span className={agentsActive ? "font-label-sm" : "font-body-base"}>Agenten</span>
            <Icon
              name="expand_more"
              className={`ml-auto shrink-0 transition-transform duration-200 ${agentsOpen ? "rotate-180" : ""}`}
              style={{ fontSize: 20 }}
            />
          </Button>

          {agentsOpen && (
            <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
              {agents.map((agent) => {
                const active = location.pathname === `/agents/${agent.id}`;
                return (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className={
                      active
                        ? "flex items-center gap-3 px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container transition-colors"
                        : "flex items-center gap-3 px-3 py-2 rounded-full text-on-surface-variant hover:bg-secondary-container transition-colors"
                    }
                  >
                    <Icon name="psychology" className="text-[18px] shrink-0" />
                    <span className="font-body-base text-sm truncate">{agent.name || "(ohne Namen)"}</span>
                  </Link>
                );
              })}
              {agents.length === 0 && (
                <span className="px-3 py-2 text-xs text-on-surface-variant/60 italic">Noch keine Agenten</span>
              )}
            </div>
          )}
        </div>

        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              navigate("/");
              setWidgetsOpen((v) => !v);
            }}
            className={`${parentClass(widgetsActive)} justify-start w-full font-body-base text-body-base`}
          >
            <Icon name="hub" />
            <span className={widgetsActive ? "font-label-sm" : "font-body-base"}>Konnektoren</span>
            <Icon
              name="expand_more"
              className={`ml-auto shrink-0 transition-transform duration-200 ${widgetsOpen ? "rotate-180" : ""}`}
              style={{ fontSize: 20 }}
            />
          </Button>

          {widgetsOpen && (
            <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
              {widgets.map((widget) => {
                const active = location.pathname === `/widgets/${widget.id}/gespraeche`;
                return (
                  <Link
                    key={widget.id}
                    to={`/widgets/${widget.id}/gespraeche`}
                    className={
                      active
                        ? "flex items-center gap-3 px-3 py-2 rounded-full bg-secondary-container text-on-secondary-container transition-colors"
                        : "flex items-center gap-3 px-3 py-2 rounded-full text-on-surface-variant hover:bg-secondary-container transition-colors"
                    }
                  >
                    <WidgetIcon name={widget.icon} size={18} className="shrink-0" />
                    <span className="font-body-base text-sm truncate">{widget.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <Link to="/statistiken" className={parentClass(statistikenActive)}>
          <Icon name="bar_chart" />
          <span className={statistikenActive ? "font-label-sm" : "font-body-base"}>Statistiken</span>
        </Link>
      </nav>
      <div className="mt-auto pt-4 border-t border-outline-variant relative">
        <div className="mb-3 flex justify-center">
          <ThemeToggle />
        </div>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-2 z-50 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden">
              {isAdmin && (
                <a
                  href={widgetPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-secondary-container transition-colors border-b border-outline-variant"
                >
                  <Icon name="open_in_new" style={{ fontSize: 18 }} />
                  Mock-Widget-Portal
                </a>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center justify-start gap-3 px-4 py-3 rounded-none font-body-base text-sm text-error hover:bg-secondary-container transition-colors"
              >
                <Icon name="logout" style={{ fontSize: 18 }} />
                Abmelden
              </Button>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center justify-start gap-3 px-2 py-1 w-full rounded-lg font-body-base text-body-base hover:bg-secondary-container transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-surface shadow-sm shrink-0">
            <span className="text-on-primary-container text-sm font-semibold">
              {user?.initials ?? "?"}
            </span>
          </div>
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm font-semibold truncate w-full text-left">
              {user?.displayName ?? "Benutzer"}
            </span>
            <span className="text-xs text-on-surface-variant truncate w-full text-left">
              {user?.role ?? "authentifiziert"}
            </span>
          </div>
          <Icon name="expand_more" className="text-on-surface-variant shrink-0" style={{ fontSize: 18 }} />
        </Button>
      </div>
    </aside>
  );
}
