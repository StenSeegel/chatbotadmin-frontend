import { useEffect, useRef, useState } from "react";
import { Button, Input, MenuItem } from "@ki4jlu/design-system";
import { Bot, Check, ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";
import { fetchModels, type LanguageModel } from "../data/models";

interface ModelComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Kombiniertes Eingabefeld + Dropdown der verfügbaren Knowledge-Bases.
 *
 * Angezeigt wird der Klarname (z. B. "PE Programm"), gespeichert bzw. an
 * `onChange` gemeldet wird jedoch die technische ID (z. B. "kb-38440355…"),
 * denn die braucht der Chat-Endpunkt und der Embed-Code. Der Feldtext ist damit
 * reiner Anzeige-/Suchtext und vom gespeicherten Wert entkoppelt. Tippen filtert
 * die Liste; committet wird beim Auswählen bzw. beim Verlassen des Feldes.
 */
export function ModelCombobox({
  id,
  value,
  onChange,
  placeholder,
  className = "",
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<LanguageModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  // Anzeige-/Suchtext des Feldes – entkoppelt vom gespeicherten `value` (ID).
  const [inputText, setInputText] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Klarname zu einer ID (oder die ID selbst, falls unbekannt/Freitext).
  const displayFor = (val: string) => models.find((m) => m.id === val)?.name || val;

  const load = (force = false) => {
    setLoading(true);
    setError(null);
    fetchModels(force)
      .then((m) => setModels(m))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Fehler beim Laden"))
      .finally(() => setLoading(false));
  };

  // Modelle direkt laden, damit der Klarname der gewählten Base sofort steht –
  // auch ohne dass das Feld fokussiert wurde. fetchModels cacht das Ergebnis.
  // setState nur in den async-Callbacks, nicht synchron im Effekt-Body.
  useEffect(() => {
    let active = true;
    fetchModels()
      .then((m) => active && setModels(m))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "Fehler beim Laden"));
    return () => {
      active = false;
    };
  }, []);

  // Feldtext mit dem gespeicherten Wert synchron halten, solange nicht gerade
  // aktiv getippt wird (Dropdown offen). Statt eines Effekts der von React
  // empfohlene "State beim Render anpassen"-Ansatz (kein set-state-in-effect):
  // greift auch, wenn die Modelle später laden und die ID zum Namen wird.
  const syncKey = `${value ?? ""}::${models.length}`;
  const [prevSyncKey, setPrevSyncKey] = useState<string | null>(null);
  if (!open && syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setInputText(displayFor(value ?? ""));
  }

  // Beim Verlassen/Schließen den Feldtext auf einen konkreten Wert festlegen:
  // exakter Namens- oder ID-Treffer → dessen ID; sonst Freitext als eigene ID.
  const commitText = () => {
    const text = inputText.trim();
    const byName = models.find((m) => (m.name ?? "").toLowerCase() === text.toLowerCase());
    const byId = models.find((m) => m.id === text);
    const committed = byName?.id ?? byId?.id ?? text;
    if (committed !== (value ?? "")) onChange(committed);
    setInputText(displayFor(committed));
    setOpen(false);
  };

  const openDropdown = () => {
    setOpen(true);
    setHighlight(0);
    if (models.length === 0 && !loading) load();
  };

  const select = (model: LanguageModel) => {
    onChange(model.id);
    setInputText(model.name || model.id);
    setOpen(false);
  };

  // Suche ist nur "aktiv", wenn der Text vom aktuell gewählten Klarnamen
  // abweicht – so zeigt ein frisch geöffnetes Dropdown die komplette Liste.
  const selectedDisplay = displayFor(value ?? "");
  const q = inputText.trim().toLowerCase();
  const searching = open && q.length > 0 && inputText !== selectedDisplay;
  const filtered = searching
    ? models.filter(
        (m) => m.id.toLowerCase().includes(q) || (m.name ?? "").toLowerCase().includes(q),
      )
    : models;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      openDropdown();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) select(filtered[highlight]);
      else commitText();
    } else if (e.key === "Escape") {
      setInputText(displayFor(value ?? "")); // Änderung verwerfen
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={inputText}
          role="combobox"
          aria-expanded={open}
          aria-controls={id ? `${id}-listbox` : undefined}
          autoComplete="off"
          onChange={(e) => {
            setInputText(e.target.value);
            if (!open) setOpen(true);
            setHighlight(0);
          }}
          onFocus={(e) => {
            openDropdown();
            e.target.select();
          }}
          onBlur={commitText}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={className}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          tabIndex={-1}
          // Fokus im Feld behalten, damit onBlur nicht vorzeitig committet.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              commitText();
            } else {
              openDropdown();
              inputRef.current?.focus();
            }
          }}
          aria-label="Knowledge-Bases anzeigen"
          className="absolute inset-y-0 right-0"
        >
          <ChevronDown
            className={`text-[20px] transition-transform ${open ? "rotate-180" : ""}`}
            width="1em"
            height="1em"
            aria-hidden
          />
        </Button>
      </div>

      {open && (
        <div
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute z-40 mt-1 w-full max-h-64 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1"
        >
          {loading && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant">
              <LoaderCircle className="text-[18px] animate-spin" width="1em" height="1em" aria-hidden />
              Modelle werden geladen…
            </div>
          )}

          {!loading && error && (
            <div className="px-3 py-2">
              <p className="text-sm text-error flex items-center gap-1.5">
                <CircleAlert className="text-[18px]" width="1em" height="1em" aria-hidden />
                {error}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => load(true)}
                className="mt-1 p-0"
              >
                Erneut versuchen
              </Button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-on-surface-variant">
              Keine passenden Knowledge-Bases.
            </p>
          )}

          {!loading &&
            !error &&
            filtered.map((m, i) => (
              <MenuItem
                key={m.id}
                type="button"
                role="option"
                aria-selected={m.id === value}
                selected={m.id === value}
                highlighted={i === highlight}
                // Verhindert, dass der Klick das Feld unfokussiert (onBlur) –
                // sonst würde commitText vor select() greifen.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => select(m)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Bot className="text-[18px] shrink-0 text-on-surface-variant" width="1em" height="1em" aria-hidden />
                  <span className="truncate">{m.name || m.id}</span>
                </span>
                {m.id === value && <Check className="ml-auto text-[18px]" width="1em" height="1em" aria-hidden />}
              </MenuItem>
            ))}
        </div>
      )}
    </div>
  );
}
