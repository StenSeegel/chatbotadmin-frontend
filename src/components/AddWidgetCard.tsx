import { Icon } from "./Icon";

export function AddWidgetCard() {
  return (
    <button className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer group bg-surface-container-low/50">
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-current flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon name="add" className="text-[32px]" />
      </div>
      <span className="font-headline-md text-headline-md">Widget hinzufügen</span>
      <p className="text-sm mt-2 opacity-70">Erstellen Sie einen neuen Bot</p>
    </button>
  );
}
