import { Icon } from "./Icon";

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { label: "Speichern", icon: "save", active: true },
  { label: "Statistiken", icon: "bar_chart" },
  { label: "Einstellungen", icon: "settings" },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 p-4 bg-surface dark:bg-inverse-surface border-r border-outline-variant z-50">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Icon name="smart_toy" className="text-primary" style={{ fontSize: 32 }} />
        <h1 className="text-headline-md font-bold text-primary">ChatBot Admin</h1>
      </div>
      <nav className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={
              item.active
                ? "flex items-center gap-4 px-4 py-3 bg-primary text-on-primary rounded-full transition-all duration-200 ease-in-out"
                : "flex items-center gap-4 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-secondary-container dark:hover:bg-secondary rounded-full transition-all duration-200 ease-in-out"
            }
          >
            <Icon name={item.icon} />
            <span className={item.active ? "font-label-sm" : "font-body-base"}>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-outline-variant">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border-2 border-surface shadow-sm">
            <span className="text-on-primary-container text-sm font-semibold">AU</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin User</span>
            <span className="text-xs text-on-surface-variant">online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
