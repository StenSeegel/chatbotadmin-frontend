import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import OpenAI from 'openai'
import { getPublicConfig, getWidget, listWidgets, upsertWidget } from './server/widgets-store.mjs'
import { appendHistory } from './server/history-store.mjs'

// Erlaubte Chat-Rollen; alles andere wird abgelehnt, bevor es an den LLM geht.
const VALID_ROLES = new Set(['system', 'user', 'assistant'])
// Absolute Obergrenze für max_tokens ohne bekanntes Widget (Quota-Schutz).
const MAX_TOKENS_CEILING = 4000

// Prüft die Nachrichten-Struktur; gibt eine Fehlermeldung zurück oder null.
function validateMessages(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return 'Keine Nachrichten übergeben.'
  for (const m of messages) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return 'Ungültige Nachricht.'
    const msg = m as { role?: unknown; content?: unknown }
    if (typeof msg.role !== 'string' || !VALID_ROLES.has(msg.role)) return 'Ungültige Nachrichtenrolle.'
    if (typeof msg.content !== 'string' || msg.content.length === 0) return 'Nachrichteninhalt fehlt.'
  }
  return null
}

// Serverseitige Obergrenze für max_tokens: per-Widget-Limit ist maßgeblich,
// sonst die absolute Obergrenze. Der Client kann das Limit nur senken.
function resolveMaxTokens(requested: unknown, widgetId?: string): number {
  let cap = MAX_TOKENS_CEILING
  if (widgetId) {
    const w = getWidget(widgetId) as { config?: { maxTokensPerAnswer?: number } } | undefined
    const perWidget = w?.config?.maxTokensPerAnswer
    if (typeof perWidget === 'number' && perWidget > 0) cap = perWidget
  }
  const req = typeof requested === 'number' && requested > 0 ? requested : cap
  return Math.min(req, cap)
}

/**
 * Dev-only proxy that exposes:
 *   POST /api/chat    — chat completion with a chosen knowledge base
 *
 * It calls the OpenAI-compatible HRZ endpoint of Uni Gießen server-side via
 * openai-node, so the API key never reaches the browser. The key and base URL
 * are read from .env WITHOUT the VITE_ prefix, which keeps them out of the
 * client bundle.
 *
 * For production you need an equivalent endpoint on your real backend — the
 * frontend only ever talks to /api/chat.
 */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) reject(new Error('Request too large'))
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Ungültiges JSON im Request-Body'))
      }
    })
    req.on('error', reject)
  })
}

function kiProxy(env: Record<string, string>): Plugin {
  const apiKey = env.KI_API_KEY
  const baseURL = env.KI_BASE_URL || 'https://api.hrz.uni-giessen.de/v1'

  // Origins allowed to call the dev backend from the browser. Mirrors the
  // production server (server/index.mjs); during development any localhost
  // origin is also accepted so the embedded widget-test page works.
  const allowedOrigins = (env.CORS_ALLOWED_ORIGINS || 'https://www.uni-giessen.de')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const isAllowedOrigin = (origin?: string) =>
    !!origin && (allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))

  // Apply CORS headers; returns true if the request was a handled preflight.
  const applyCors = (req: IncomingMessage, res: ServerResponse): boolean => {
    const origin = req.headers.origin
    if (isAllowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin as string)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return true
    }
    return false
  }

  const json = (res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void }, status: number, payload: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }

  // Speichert einen Frage/Antwort-Austausch, sofern das Widget existiert und
  // `saveHistory` aktiviert hat. Best-effort – Fehler dürfen den Chat nicht stören.
  const saveHistoryIfEnabled = (
    widgetId: string | undefined,
    messages: ChatMessage[],
    answer: string,
    finishReason: string | null,
  ) => {
    if (!widgetId) return
    try {
      const widget = getWidget(widgetId) as { config?: { saveHistory?: boolean } } | undefined
      if (!widget?.config?.saveHistory) return
      const lastUser = [...messages].reverse().find((m) => m && m.role === 'user')
      appendHistory({ widgetId, question: lastUser?.content ?? '', answer: answer || '', finishReason })
    } catch {
      /* Verlauf-Speicherung ist best-effort */
    }
  }

  return {
    name: 'ki-proxy',
    configureServer(server) {
      // Widget-Konfigurationen (persistent im widgets-store). connect entfernt
      // den Mount-Pfad, sodass req.url hier '/' bzw. '/:id' ist.
      server.middlewares.use('/api/widgets', async (req, res) => {
        if (applyCors(req, res)) return
        const sub = (req.url || '/').split('?')[0]
        const id = sub === '/' || sub === '' ? '' : decodeURIComponent(sub.replace(/^\//, ''))

        if (!id && req.method === 'GET') return json(res, 200, { widgets: listWidgets() })

        if (id && req.method === 'GET') {
          const config = getPublicConfig(id)
          if (!config) return json(res, 404, { error: 'Widget nicht gefunden.' })
          return json(res, 200, config)
        }

        if (id && req.method === 'PUT') {
          let body: { id?: string }
          try {
            body = (await readJson(req)) as typeof body
          } catch (err) {
            return json(res, 400, { error: err instanceof Error ? err.message : 'Ungültiger Request' })
          }
          if (!body || body.id !== id) return json(res, 400, { error: 'Widget-id im Body muss zur URL passen.' })
          try {
            return json(res, 200, upsertWidget(body))
          } catch (err) {
            return json(res, 400, { error: err instanceof Error ? err.message : 'Speichern fehlgeschlagen' })
          }
        }

        json(res, 405, { error: 'Method Not Allowed' })
      })

      // Liste der verfügbaren Sprachmodelle (für das Knowledge-Base-ID-Dropdown
      // in der Admin-Oberfläche). Wird serverseitig über openai-node geladen, so
      // bleibt der API-Key im Browser unsichtbar.
      server.middlewares.use('/api/models', async (req, res) => {
        if (applyCors(req, res)) return
        if (req.method !== 'GET') return json(res, 405, { error: 'Method Not Allowed' })
        if (!apiKey) return json(res, 503, { error: 'KI_API_KEY ist nicht gesetzt. Bitte in .env eintragen.' })

        try {
          const client = new OpenAI({ apiKey, baseURL })
          const list = await client.models.list()
          const models = list.data
            .map((m) => ({ id: m.id, ownedBy: m.owned_by, created: m.created }))
            .sort((a, b) => a.id.localeCompare(b.id))
          json(res, 200, { models })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
          json(res, 502, { error: `Modelle konnten nicht geladen werden: ${message}` })
        }
      })

      server.middlewares.use('/api/chat', async (req, res) => {
        if (applyCors(req, res)) return
        if (req.method !== 'POST') return json(res, 405, { error: 'Method Not Allowed' })
        if (!apiKey) return json(res, 503, { error: 'KI_API_KEY ist nicht gesetzt. Bitte in .env eintragen.' })

        let body: { knowledgeBaseId?: string; model?: string; messages?: ChatMessage[]; maxTokens?: number; stream?: boolean; widgetId?: string }
        try {
          body = (await readJson(req)) as typeof body
        } catch (err) {
          return json(res, 400, { error: err instanceof Error ? err.message : 'Ungültiger Request' })
        }

        // `knowledgeBaseId` ist das neue Feld; `model` bleibt als Fallback für ältere Clients.
        const knowledgeBaseId = body.knowledgeBaseId || body.model
        if (!knowledgeBaseId) return json(res, 400, { error: 'Keine Knowledge-Base-ID angegeben.' })
        const messagesError = validateMessages(body.messages)
        if (messagesError) return json(res, 400, { error: messagesError })

        const client = new OpenAI({ apiKey, baseURL })
        // validateMessages hat oben sichergestellt, dass dies ein gültiges Array ist.
        const messages = body.messages as ChatMessage[]
        const widgetId = body.widgetId
        // max_tokens serverseitig begrenzen — der Client kann das Limit nur senken.
        const maxTokens = resolveMaxTokens(body.maxTokens, widgetId)

        // ── Streaming (Server-Sent Events) ──
        if (body.stream) {
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          let aborted = false
          const send = (data: unknown) => {
            if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`)
          }

          try {
            const stream = await client.chat.completions.create({
              model: knowledgeBaseId,
              messages,
              max_tokens: maxTokens,
              stream: true,
            })

            // Client-Abbruch → Upstream-Stream stoppen (siehe server/index.mjs).
            req.on('close', () => {
              aborted = true
              stream.controller.abort()
            })

            let finishReason: string | null = null
            let answer = ''
            for await (const chunk of stream) {
              const choice = chunk.choices[0]
              const content = choice?.delta?.content
              if (content) {
                answer += content
                send({ content })
              }
              if (choice?.finish_reason) finishReason = choice.finish_reason
            }
            send({ done: true, finishReason })
            saveHistoryIfEnabled(widgetId, messages, answer, finishReason)
          } catch (err) {
            if (!aborted) {
              const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
              send({ error: `Antwort konnte nicht generiert werden: ${message}` })
            }
          }
          if (!res.writableEnded) res.end()
          return
        }

        // ── Non-streaming (single JSON response) ──
        try {
          const completion = await client.chat.completions.create({
            model: knowledgeBaseId,
            messages,
            max_tokens: maxTokens,
          })
          const choice = completion.choices[0]
          const reply = choice?.message?.content ?? ''
          const finishReason = choice?.finish_reason ?? null
          saveHistoryIfEnabled(widgetId, messages, reply, finishReason)
          json(res, 200, { reply, finishReason })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
          json(res, 502, { error: `Antwort konnte nicht generiert werden: ${message}` })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' = load all vars, including those without the VITE_ prefix (server-side only).
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), kiProxy(env)],
  }
})
