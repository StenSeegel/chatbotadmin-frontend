import { Switch } from "@ki4jlu/design-system";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

/** Labeled on/off row. The control itself is the design system's Switch. */
export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-on-surface">{label}</span>
        {description && <span className="text-xs text-on-surface-variant">{description}</span>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
