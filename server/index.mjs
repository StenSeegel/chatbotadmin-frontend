import http from "node:http";
import OpenAI from "openai";
import { getPublicConfig, getWidget, listWidgets, upsertWidget } from "./widgets-store.mjs";
import { appendHistory } from "./history-store.mjs";

/**
 * Standalone-Backend für die Produktions-/Docker-Umgebung.
 *
 * Stellt dieselben Endpunkte bereit wie der Vite-Dev-Proxy (siehe
 * vite.config.ts → kiProxy):
 *   POST /api/chat          — Chat-Completion (optional als SSE-Stream)
 *   GET  /api/widgets       — alle Widgets (Admin)
 *   PUT  /api/widgets/:id   — Widget anlegen/aktualisieren (Admin)
 *   GET  /api/widgets/:id   — öffentliche Konfiguration für widget.js
 *
 * /api/chat ruft den OpenAI-kompatiblen HRZ-Endpunkt der Uni Gießen serverseitig
 * über openai-node auf, sodass der API-Key nie den Browser erreicht. Key und
 * Base-URL kommen aus der Umgebung (KI_API_KEY / KI_BASE_URL). Widget-Konfigs
 * liegen persistent im widgets-store (Datei via WIDGETS_FILE).
 */

const apiKey = process.env.KI_API_KEY;
const baseURL = process.env.KI_BASE_URL || "https://api.hrz.uni-giessen.de/v1";
const port = Number(process.env.PORT) || 3001;

// Origins allowed to call this backend from the browser. The embedded widget
// runs on a different origin (e.g. the Plone page), so cross-origin requests
// need explicit CORS. Comma-separated; list only the origins actually needed —
// never "*". Override via CORS_ALLOWED_ORIGINS.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "https://www.uni-giessen.de")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// An origin is allowed if it is on the configured allowlist (exact match, e.g.
// https://www.uni-giessen.de ≠ https://uni-giessen.de) OR is any localhost
// origin, so the local Docker test stack (test portal on :8082 → frontend on
// :8081) works cross-port without extra config. Mirrors the Vite dev proxy.
function isAllowedOrigin(origin) {
  return (
    !!origin &&
    (allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  );
}

// Set CORS headers on every response (also errors and the OPTIONS preflight).
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error("Request too large"));
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Ungültiges JSON im Request-Body"));
      }
    });
    req.on("error", reject);
  });
}

// ── In-memory rate limiter (per client IP) ──
// Defense-in-depth flood protection for the LLM backend (Nginx also rate-limits
// /api/, but this guards the backend even if reached directly). Fixed window;
// window size and max are configurable via env.
const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const rateMax = Number(process.env.RATE_LIMIT_MAX) || 30;
const rateHits = new Map(); // ip -> { count, resetAt }

function clientIp(req) {
  const fwd = req.headers["x-real-ip"] || req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

// Returns true (and sends a 429) when the client has exceeded its quota.
function rateLimited(req, res) {
  const ip = clientIp(req);
  const now = Date.now();
  let entry = rateHits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + rateWindowMs };
    rateHits.set(ip, entry);
  }
  entry.count++;
  if (entry.count > rateMax) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    sendJson(res, 429, { error: "Zu viele Anfragen. Bitte später erneut versuchen." });
    return true;
  }
  return false;
}

// Drop expired entries periodically so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateHits) if (now > entry.resetAt) rateHits.delete(ip);
}, rateWindowMs).unref();

// Speichert einen Frage/Antwort-Austausch, sofern das Widget existiert und
// `saveHistory` in seiner Konfiguration aktiviert ist. Best-effort: Fehler beim
// Speichern dürfen die Chat-Antwort nie beeinträchtigen.
function saveHistoryIfEnabled(widgetId, messages, answer, finishReason) {
  if (!widgetId) return;
  try {
    const widget = getWidget(widgetId);
    if (!widget || !widget.config || !widget.config.saveHistory) return;
    const lastUser = [...messages].reverse().find((m) => m && m.role === "user");
    appendHistory({
      widgetId,
      question: lastUser ? lastUser.content : "",
      answer: answer || "",
      finishReason: finishReason ?? null,
    });
  } catch {
    /* Verlauf-Speicherung ist best-effort */
  }
}

// Erlaubte Chat-Rollen; alles andere wird abgelehnt, bevor es an den LLM geht.
const VALID_ROLES = new Set(["system", "user", "assistant"]);
// Absolute Obergrenze für max_tokens, wenn kein bekanntes Widget ein Limit
// vorgibt (schützt Direktaufrufe ohne gültige widgetId vor Quota-Missbrauch).
const MAX_TOKENS_CEILING = 4000;

// Prüft die Nachrichten-Struktur. Gibt eine Fehlermeldung zurück oder null,
// wenn alles in Ordnung ist. Verhindert, dass beliebige Payloads an den LLM
// durchgereicht werden.
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "Keine Nachrichten übergeben.";
  for (const m of messages) {
    if (!m || typeof m !== "object" || Array.isArray(m)) return "Ungültige Nachricht.";
    if (!VALID_ROLES.has(m.role)) return "Ungültige Nachrichtenrolle.";
    if (typeof m.content !== "string" || m.content.length === 0) return "Nachrichteninhalt fehlt.";
  }
  return null;
}

// Serverseitige Obergrenze für max_tokens: das per-Widget-Limit (falls das
// Widget bekannt ist) ist maßgeblich, sonst greift die absolute Obergrenze.
// Ein vom Client gesendeter Wert kann das Limit nur senken, nie überschreiten.
function resolveMaxTokens(requested, widgetId) {
  let cap = MAX_TOKENS_CEILING;
  if (widgetId) {
    const perWidget = getWidget(widgetId)?.config?.maxTokensPerAnswer;
    if (typeof perWidget === "number" && perWidget > 0) cap = perWidget;
  }
  const req = typeof requested === "number" && requested > 0 ? requested : cap;
  return Math.min(req, cap);
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  // CORS preflight: answer before any routing/auth so the browser proceeds.
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const path = (req.url || "").split("?")[0];

  // Rate-limit the API endpoints (not the 404 path).
  if (path.startsWith("/api/") && rateLimited(req, res)) return;

  // ── GET /api/widgets ── (Admin: alle Widgets)
  if (path === "/api/widgets" && req.method === "GET") {
    return sendJson(res, 200, { widgets: listWidgets() });
  }

  // ── /api/widgets/:id ──
  if (path.startsWith("/api/widgets/")) {
    const id = decodeURIComponent(path.slice("/api/widgets/".length));

    // GET: öffentliche Konfiguration für widget.js
    if (req.method === "GET") {
      const config = getPublicConfig(id);
      if (!config) return sendJson(res, 404, { error: "Widget nicht gefunden." });
      return sendJson(res, 200, config);
    }

    // PUT: Widget anlegen/aktualisieren (Admin)
    if (req.method === "PUT") {
      let body;
      try {
        body = await readJson(req);
      } catch (err) {
        return sendJson(res, 400, { error: err instanceof Error ? err.message : "Ungültiger Request" });
      }
      if (!body || body.id !== id) {
        return sendJson(res, 400, { error: "Widget-id im Body muss zur URL passen." });
      }
      try {
        return sendJson(res, 200, upsertWidget(body));
      } catch (err) {
        return sendJson(res, 400, { error: err instanceof Error ? err.message : "Speichern fehlgeschlagen" });
      }
    }
  }

  // ── GET /api/models ──
  // Liste der verfügbaren Sprachmodelle für das Knowledge-Base-ID-Dropdown der
  // Admin-Oberfläche. Läuft serverseitig über openai-node, der Key bleibt hier.
  if (path === "/api/models" && req.method === "GET") {
    if (!apiKey) return sendJson(res, 503, { error: "KI_API_KEY ist nicht gesetzt." });
    try {
      const client = new OpenAI({ apiKey, baseURL });
      const list = await client.models.list();
      const models = list.data
        .map((m) => ({ id: m.id, ownedBy: m.owned_by, created: m.created }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return sendJson(res, 200, { models });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      return sendJson(res, 502, { error: `Modelle konnten nicht geladen werden: ${message}` });
    }
  }

  // ── POST /api/chat ──
  if (path === "/api/chat" && req.method === "POST") {
    if (!apiKey) return sendJson(res, 503, { error: "KI_API_KEY ist nicht gesetzt." });

    let body;
    try {
      body = await readJson(req);
    } catch (err) {
      return sendJson(res, 400, { error: err instanceof Error ? err.message : "Ungültiger Request" });
    }

    // `knowledgeBaseId` ist das neue Feld; `model` bleibt als Fallback für ältere Clients.
    const knowledgeBaseId = body.knowledgeBaseId || body.model;
    if (!knowledgeBaseId) return sendJson(res, 400, { error: "Keine Knowledge-Base-ID angegeben." });
    const messagesError = validateMessages(body.messages);
    if (messagesError) return sendJson(res, 400, { error: messagesError });

    const client = new OpenAI({ apiKey, baseURL });
    // Optional: Widget-ID, damit der Verlauf bei aktiviertem `saveHistory`
    // gespeichert werden kann (nur echte Einbettungen senden sie mit).
    const widgetId = body.widgetId;
    // max_tokens serverseitig begrenzen — der Client kann das Limit nur senken.
    const maxTokens = resolveMaxTokens(body.maxTokens, widgetId);

    // Streaming (Server-Sent Events)
    if (body.stream) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      let aborted = false;
      const send = (data) => {
        if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        const stream = await client.chat.completions.create({
          model: knowledgeBaseId,
          messages: body.messages,
          max_tokens: maxTokens,
          stream: true,
        });

        // Bricht der Client die Verbindung ab (Tab geschlossen, weggenavigiert),
        // den Upstream-Stream stoppen, damit keine Tokens (und Kosten) ins Leere
        // weiterlaufen und die verwaiste Verbindung freigegeben wird.
        req.on("close", () => {
          aborted = true;
          stream.controller.abort();
        });

        let finishReason = null;
        let answer = "";
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          const content = choice?.delta?.content;
          if (content) {
            answer += content;
            send({ content });
          }
          if (choice?.finish_reason) finishReason = choice.finish_reason;
        }
        send({ done: true, finishReason });
        saveHistoryIfEnabled(widgetId, body.messages, answer, finishReason);
      } catch (err) {
        // Ein durch den Client-Abbruch ausgelöster Fehler ist erwartet — nicht melden.
        if (!aborted) {
          const message = err instanceof Error ? err.message : "Unbekannter Fehler";
          send({ error: `Antwort konnte nicht generiert werden: ${message}` });
        }
      }
      if (!res.writableEnded) res.end();
      return;
    }

    // Non-streaming (einzelne JSON-Antwort)
    try {
      const completion = await client.chat.completions.create({
        model: knowledgeBaseId,
        messages: body.messages,
        max_tokens: maxTokens,
      });
      const choice = completion.choices[0];
      const reply = choice?.message?.content ?? "";
      const finishReason = choice?.finish_reason ?? null;
      saveHistoryIfEnabled(widgetId, body.messages, reply, finishReason);
      return sendJson(res, 200, { reply, finishReason });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      return sendJson(res, 502, { error: `Antwort konnte nicht generiert werden: ${message}` });
    }
  }

  sendJson(res, 404, { error: "Not Found" });
});

server.listen(port, () => {
  console.log(`KI backend listening on :${port} (baseURL=${baseURL})`);
});
