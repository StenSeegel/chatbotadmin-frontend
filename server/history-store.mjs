import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Persistente Ablage der Gesprächsverläufe ("Gesprächsverlauf speichern").
 *
 * Wird sowohl vom Produktions-Backend (server/index.mjs) als auch vom
 * Vite-Dev-Proxy (vite.config.ts) genutzt, analog zum widgets-store. Gespeichert
 * wird ein Eintrag pro abgeschlossenem Frage/Antwort-Austausch – nur für Widgets,
 * deren Konfiguration `saveHistory` aktiviert hat. Pfad über HISTORY_FILE
 * überschreibbar (Default: ./data/history.json neben diesem Modul); in Docker
 * liegt er im backend-data-Volume, damit Verläufe Neustarts überstehen.
 */

const DATA_FILE =
  process.env.HISTORY_FILE || fileURLToPath(new URL("./data/history.json", import.meta.url));

// Obergrenze, damit die Datei nicht unbegrenzt wächst; die ältesten Einträge
// werden verworfen, sobald das Limit überschritten wird.
const MAX_ENTRIES = Number(process.env.HISTORY_MAX_ENTRIES) || 5000;

function readAll() {
  try {
    if (!existsSync(DATA_FILE)) return [];
    const parsed = JSON.parse(readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

/**
 * Hängt einen Verlauf-Eintrag an. `entry` sollte { widgetId, question, answer,
 * finishReason } enthalten; ein ISO-Zeitstempel (`at`) wird ergänzt. Gibt den
 * gespeicherten Eintrag zurück.
 */
export function appendHistory(entry) {
  const record = { at: new Date().toISOString(), ...entry };
  const entries = readAll();
  entries.push(record);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  writeAll(entries);
  return record;
}
