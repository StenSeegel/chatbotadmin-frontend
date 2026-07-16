import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, Check, ListFilter, Search, type LucideIcon } from "lucide-react";
import { Button, Input, MenuItem } from "@ki4jlu/design-system";
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

function ToolbarDropdown<T extends string>({ icon: IconCmp, label, options, value, defaultValue, onChange }: ToolbarDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== defaultValue;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative flex-1 lg:flex-none" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full${
          // Active-state skin on the dropdown trigger (kept deliberately; see
          // design-system variant candidate "toggle/active trigger").
          isActive ? " border-primary text-primary bg-primary/10 hover:bg-primary/10" : ""
        }`}
      >
        <IconCmp className="text-[16px]" width="1em" height="1em" aria-hidden />
        {label}
        {isActive && <span>({options.find((option) => option.value === value)?.label})</span>}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md z-10 overflow-hidden">
          {options.map((option) => (
            <MenuItem
              key={option.value}
              type="button"
              selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
              {value === option.value && (
                <Check className="ml-auto text-[16px]" width="1em" height="1em" aria-hidden />
              )}
            </MenuItem>
          ))}
        </div>
      )}
    </div>
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
    <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
      <div className="relative group w-full lg:max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-[18px]"
          width="1em"
          height="1em"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder="Widgets durchsuchen..."
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full lg:w-auto">
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
