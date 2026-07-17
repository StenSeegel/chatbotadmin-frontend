import { ArrowUpDown, Check, ListFilter, Search, type LucideIcon } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@ki4jlu/design-system";
import type { WidgetStatus } from "../types/widget";

export type StatusFilter = "all" | WidgetStatus;

export type SortOption = "name" | "conversations" | "rating";

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pause" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name (A-Z)" },
  { value: "conversations", label: "Gespräche" },
  { value: "rating", label: "Bewertung" },
];

interface ToolbarDropdownProps<T extends string> {
  icon: LucideIcon;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  defaultValue: T;
  onChange: (value: T) => void;
}

// Radix-Menü aus dem Design-System: Escape, Pfeiltasten, Fokus-Rückgabe und
// ARIA kommen mit; der Outline-Trigger zeigt seinen Offen-Zustand selbst
// (data-state=open). Ein aktiver Filter wird über den Optionsnamen im Label
// angezeigt.
function ToolbarDropdown<T extends string>({
  icon: IconCmp,
  label,
  options,
  value,
  defaultValue,
  onChange,
}: ToolbarDropdownProps<T>) {
  const isActive = value !== defaultValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="w-full flex-1 lg:w-auto lg:flex-none">
          <IconCmp className="text-[16px]" width="1em" height="1em" aria-hidden />
          {label}
          {isActive && <span>({options.find((option) => option.value === value)?.label})</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          >
            {option.label}
            {value === option.value && (
              <Check className="ml-auto text-[16px]" width="1em" height="1em" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  sortOption: SortOption;
  onSortOptionChange: (value: SortOption) => void;
}

export function SearchToolbar({
  value,
  onChange,
  statusFilter,
  onStatusFilterChange,
  sortOption,
  onSortOptionChange,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">
      <div className="w-full lg:max-w-sm">
        <Input
          leadingIcon={<Search aria-hidden />}
          placeholder="Widgets durchsuchen..."
          aria-label="Widgets durchsuchen"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="flex w-full gap-2 lg:w-auto">
        <ToolbarDropdown
          icon={ListFilter}
          label="Filter"
          options={FILTER_OPTIONS}
          value={statusFilter}
          defaultValue="all"
          onChange={onStatusFilterChange}
        />
        <ToolbarDropdown
          icon={ArrowUpDown}
          label="Sortieren"
          options={SORT_OPTIONS}
          value={sortOption}
          defaultValue="name"
          onChange={onSortOptionChange}
        />
      </div>
    </div>
  );
}
