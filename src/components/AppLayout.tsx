import { Outlet } from "react-router-dom";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import {
  AppShellLayout,
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Logo,
  ThemeToggle,
} from "@ki4jlu/design-system";
import { useAuth } from "../auth/AuthContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { resolveWidgetPortalUrl } from "../lib/widgetPortal";
import { AppSidebarNav } from "./AppSidebarNav";

// App-Shell für alle geschützten Routen: Layout-Route mit <Outlet/>.
// Ersetzt AuthenticatedLayout + Sidebar + TopAppBar + BottomNavBar — Desktop-
// Sidebar und Mobile-Drawer kommen komplett aus dem Design-System.
export function AppLayout() {
  const { logout } = useAuth();
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const widgetPortalUrl = resolveWidgetPortalUrl();

  return (
    <AppShellLayout
      logo={<Logo product="CampusAgents" size="sm" />}
      nav={<AppSidebarNav />}
      sidebarFooter={
        <div className="flex items-center gap-stack-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="min-w-0 flex-1 justify-start">
                <Avatar initials={user?.initials ?? "?"} size="sm" />
                <span className="flex min-w-0 flex-col items-start">
                  <span className="w-full truncate text-left font-semibold">
                    {user?.displayName ?? "Benutzer"}
                  </span>
                  <span className="w-full truncate text-left text-xs text-on-surface-variant">
                    {user?.role ?? "authentifiziert"}
                  </span>
                </span>
                <ChevronDown className="ml-auto shrink-0" width="1em" height="1em" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start">
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <a href={widgetPortalUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink width="1em" height="1em" aria-hidden />
                    Mock-Widget-Portal
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem variant="destructive" onSelect={logout}>
                <LogOut width="1em" height="1em" aria-hidden />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      }
    >
      <Outlet />
    </AppShellLayout>
  );
}
