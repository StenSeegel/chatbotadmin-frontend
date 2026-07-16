import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Bot, Brain, ChartColumn, ChevronDown, ExternalLink, LogOut, Waypoints } from "lucide-react";
import { WidgetIcon } from "./WidgetIcon";
import { Button, MenuItem, NavItem, ThemeToggle } from "@ki4jlu/design-system";
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

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 p-4 bg-surface-container-low border-r border-outline-variant z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Bot className="text-primary" style={{ fontSize: 32 }} width="1em" height="1em" aria-hidden />
        <h1 className="text-headline-md font-bold text-primary">ChatBot Admin</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-grow overflow-y-auto">
        <div>
          <NavItem
            type="button"
            active={agentsActive}
            onClick={() => {
              navigate("/agents");
              setAgentsOpen((v) => !v);
            }}
          >
            <Brain width="1em" height="1em" aria-hidden />
            <span>Agenten</span>
            <ChevronDown
              className={`ml-auto shrink-0 transition-transform duration-200 ${agentsOpen ? "rotate-180" : ""}`}
              style={{ fontSize: 20 }}
              width="1em"
              height="1em"
              aria-hidden
            />
          </NavItem>

          {agentsOpen && (
            <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
              {agents.map((agent) => {
                const active = location.pathname === `/agents/${agent.id}`;
                return (
                  <NavItem key={agent.id} asChild level="sub" active={active}>
                    <Link to={`/agents/${agent.id}`}>
                      <Brain className="text-[18px]" width="1em" height="1em" aria-hidden />
                      <span className="truncate">{agent.name || "(ohne Namen)"}</span>
                    </Link>
                  </NavItem>
                );
              })}
              {agents.length === 0 && (
                <span className="px-3 py-2 text-xs text-on-surface-variant/60 italic">Noch keine Agenten</span>
              )}
            </div>
          )}
        </div>

        <div>
          <NavItem
            type="button"
            active={widgetsActive}
            onClick={() => {
              navigate("/");
              setWidgetsOpen((v) => !v);
            }}
          >
            <Waypoints width="1em" height="1em" aria-hidden />
            <span>Konnektoren</span>
            <ChevronDown
              className={`ml-auto shrink-0 transition-transform duration-200 ${widgetsOpen ? "rotate-180" : ""}`}
              style={{ fontSize: 20 }}
              width="1em"
              height="1em"
              aria-hidden
            />
          </NavItem>

          {widgetsOpen && (
            <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-outline-variant pl-3">
              {widgets.map((widget) => {
                const active = location.pathname === `/widgets/${widget.id}/gespraeche`;
                return (
                  <NavItem key={widget.id} asChild level="sub" active={active}>
                    <Link to={`/widgets/${widget.id}/gespraeche`}>
                      <WidgetIcon name={widget.icon} size={18} className="shrink-0" />
                      <span className="truncate">{widget.name}</span>
                    </Link>
                  </NavItem>
                );
              })}
            </div>
          )}
        </div>

        <NavItem asChild active={statistikenActive}>
          <Link to="/statistiken">
            <ChartColumn width="1em" height="1em" aria-hidden />
            <span>Statistiken</span>
          </Link>
        </NavItem>
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
                <MenuItem asChild className="border-b border-outline-variant">
                  <a
                    href={widgetPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ExternalLink style={{ fontSize: 18 }} width="1em" height="1em" aria-hidden />
                    Mock-Widget-Portal
                  </a>
                </MenuItem>
              )}
              <MenuItem
                type="button"
                variant="destructive"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut style={{ fontSize: 18 }} width="1em" height="1em" aria-hidden />
                Abmelden
              </MenuItem>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full justify-start gap-3"
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
          <ChevronDown className="text-on-surface-variant shrink-0" style={{ fontSize: 18 }} width="1em" height="1em" aria-hidden />
        </Button>
      </div>
    </aside>
  );
}
