import { Link, useLocation } from "react-router-dom";
import { ChartColumn, LayoutGrid, type LucideIcon } from "lucide-react";

interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  to: string;
  /** Prefixe, die diesen Eintrag aktiv markieren (zusätzlich zum exakten `to`). */
  match: (pathname: string) => boolean;
}

const navItems: BottomNavItem[] = [
  {
    label: "Widgets",
    icon: LayoutGrid,
    to: "/",
    match: (p) => p === "/" || p.startsWith("/widgets"),
  },
  {
    label: "Statistiken",
    icon: ChartColumn,
    to: "/statistiken",
    match: (p) => p.startsWith("/statistiken"),
  },
];

export function BottomNavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant px-6 py-3 flex justify-around items-center z-50 lg:hidden">
      {navItems.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.label}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex flex-col items-center gap-1 text-primary"
                : "flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
            }
          >
            <item.icon width="1em" height="1em" aria-hidden />
            <span className="font-label-sm text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
