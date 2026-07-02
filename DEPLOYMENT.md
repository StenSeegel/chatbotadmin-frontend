# Chatbot Widget - Deployment & Testing Guide

This guide outlines how to embed, test, and verify the Chatbot Widget both in your local development environment and on the staging server.

---

## 1. TESTING LOCALLY (localhost)

For local testing, the project runs a multi-container setup:
1. **`local-frontend`**: Serves the Chatbot Admin UI and hosts the widget loader script (`/widget.js`) at **`http://localhost:8081`**. Nginx proxies `/api/` to the backend.
2. **`local-backend`**: Provides `/api/chat` (calls the HRZ model endpoint server-side, so `KI_API_KEY` never reaches the browser) and `/api/widgets` (the persistent source of truth for widget configurations). Started automatically as a dependency of `local-frontend`.
3. **`widget-test-site`**: A lightweight Nginx container serving a mockup JLU Gießen portal page at **`http://localhost:8082`**.

> [!NOTE]
> Copy `.env.example` to `.env` and set `KI_API_KEY` before starting — otherwise `/api/chat` returns `503` and the widget shows an error instead of an answer.

### Browser Links
* **Admin UI:** [http://localhost:8081](http://localhost:8081)
* **Widget Mock Portal:** [http://localhost:8082](http://localhost:8082)

### Quick Start
To start the local testing stack with live rebuilding:
```bash
docker compose up local-frontend local-backend widget-test-site -d --build
```

### Testing Steps
1. **Access the Mock Portal:** Open your browser and navigate to [http://localhost:8082](http://localhost:8082).
2. **Configure the Widget Teststeuerung Panel:** 
   * Confirm the **Widget Server Origin** is set to `http://localhost:8081` (your local frontend server).
   * Select a **Widget ID** (e.g., `support-bot` or `sales-tracker`).
   * Click **Widget neu laden** (Reload Widget). This dynamically injects the passive `div` placeholder and the global script loader into the DOM.
3. **Verify Widget Behavior:**
   * The floating action button (FAB) with the configured icon (e.g., a globe) should appear in the corner specified by the widget layout.
   * Click the FAB to open the chatbot window.
   * You should see a typing indicator followed by the greeting message.
   * Ask the bot a real question (e.g., *"Was ist die JLU?"*). The answer is streamed live from the configured knowledge base via `/api/chat` — the widget keeps conversation context across turns.
4. **Access the Admin Panel:** Manage and configure widgets at [http://localhost:8081](http://localhost:8081).

---

## 2. TESTING ON STAGING SERVER (sv90073.hrz.uni-giessen.de)

On the staging environment hosted at **`sv90073.hrz.uni-giessen.de`**, the widget script is served globally, allowing you to embed it on external test pages or mock CMS sites.

### Staging Architecture
* **Admin Frontend / Widget Script:** `https://sv90073.hrz.uni-giessen.de/widget.js`
* **Staging Test Site:** ``

### Browser Links
* **Staging Admin UI:** [https://sv90073.hrz.uni-giessen.de](https://sv90073.hrz.uni-giessen.de)
* **Staging Widget Mock Portal:** [https://sv90073.hrz.uni-giessen.de/test-widget/](https://sv90073.hrz.uni-giessen.de/test-widget/)

### Running the Stack on Staging
1. SSH into the staging server:
   ```bash
   ssh user@sv90073.hrz.uni-giessen.de
   ```
2. Navigate to your project directory and pull the latest production images from the GitHub Container Registry:
   ```bash
   docker compose pull
   ```
3. Ensure the staging `.env` is present and contains `KI_API_KEY` and `CORS_ALLOWED_ORIGINS` (see Section 4), then run the services in background mode:
   ```bash
   docker compose up -d
   ```
   *This starts the `chatbotadmin-frontend` on host port `443` (SSL, which also serves the mock test site securely under `/test-widget/`) together with the `backend` service. Nginx proxies `/api/` to `backend:3001`, so the API key stays server-side. The `backend` image is built from `./server` on first run.*

### Embedding the Widget on Staging Pages
To test the widget on staging CMS environments or static staging portals:

1. **Add the HTML Placeholder Container:**https://sv90073.hrz.uni-giessen.de/test-widget/
   Paste the following passive `<div>` container into the page content (e.g., via rich text editor or raw HTML block). Editors do not need to paste script tags here:
   ```html
   <div class="chatbot-widget"
        data-widget-id="support-bot"
        data-kb="jlu/gpt-oss-20b"
        data-routing="public-widget"
        data-lang="de"></div>
   ```
   *The widget fetches its configuration (title, greeting, color, position, icon, templates, rules, knowledge base, max tokens, feedback) from the backend by `data-widget-id` — so **changes saved in the admin panel reach the embedded widget** without editing any code. `data-kb`/`data-model` and the `data-*` style attributes remain as fallbacks/overrides when no backend config is available. The widget calls `/api/chat` and `/api/widgets/:id` on the host it was loaded from; override the API base with `data-api="https://…/api"` if the backend lives elsewhere.*

### Widget configuration is server-side

The backend (`server/index.mjs` in prod, the Vite proxy in dev) is the single source of truth for widget configs, persisted as JSON via the `widgets-store` module:

* `GET /api/widgets` — all widgets (admin panel).
* `PUT /api/widgets/:id` — create/update a widget (admin panel).
* `GET /api/widgets/:id` — public, presentation-only config consumed by `widget.js`.

Persistence path is set by `WIDGETS_FILE` (default `./data/widgets.json` next to the module). In Docker it is backed by the `backend-data` volume so configs survive restarts and image rebuilds.
2. **Include the Global Loader Script:**
   Include the widget script **once globally** in the staging portal's main theme (e.g., in the `<head>` or before `</body>`):
   ```html
   <script src="https://sv90073.hrz.uni-giessen.de/widget.js" defer></script>
   ```

## 3. SSL CONFIGURATION ON STAGING

To configure SSL on the staging server using your certificate files:
* **Private Key:** `/etc/ssl/private/priv.pem`
* **Certificate:** `/etc/ssl/certs/sv90073.pem`

You can configure the Nginx web server inside the Docker container to handle SSL termination directly. We have created a staging Nginx config file [nginx.staging.conf](nginx.staging.conf) in the project.

1. **Update `docker-compose.yml` on Staging:**
   Modify the `chatbotadmin-frontend` service to mount your SSL certificates, mount the staging Nginx configuration, and map the SSL ports (default is port 443 for HTTPS and port 80 for HTTP redirects):
   ```yaml
     chatbotadmin-frontend:
       image: ghcr.io/stenseegel/chatbotadmin-frontend:latest
       container_name: chatbotadmin-frontend
       ports:
         - "443:443"             # Maps host port 443 to container HTTPS port 443
         - "80:80"               # Maps host port 80 to container HTTP port 80 (for redirects)
       volumes:
         # Mount host certificates into container Nginx SSL folder
         - /etc/ssl/certs/sv90073.pem:/etc/nginx/ssl/sv90073.pem:ro
         - /etc/ssl/private/priv.pem:/etc/nginx/ssl/priv.pem:ro
         # Override default nginx config with staging configuration
         - ./nginx.staging.conf:/etc/nginx/conf.d/default.conf:ro
       restart: always
       depends_on:
         - backend             # Nginx proxies /api/ to this service

     # KI-Backend: serves /api/chat; reads KI_API_KEY /
     # CORS_ALLOWED_ORIGINS from .env. Not exposed on the host — only reachable
     # inside the compose network via backend:3001.
     backend:
       build:
         context: ./server
       container_name: chatbotadmin-backend
       env_file:
         - .env
       expose:
         - "3001"
       restart: always
   ```
2. **Access Staging UI:** 
   Once restarted (`docker compose up -d`), you can access the secure site at:
   * **Staging Admin UI:** [https://sv90073.hrz.uni-giessen.de](https://sv90073.hrz.uni-giessen.de)
   * **Staging Widget Script:** `https://sv90073.hrz.uni-giessen.de/widget.js`

> [!NOTE]
> **Do we need the port in the staging URL?**
> * **Using Port 443:** If you bind to the default HTTPS port (`"443:443"`), **you do not need the port in the URL** (e.g. `https://sv90073.hrz.uni-giessen.de/widget.js`).
> * **Alternative Port 442:** If port `443` is already in use by another service on the host, change the ports mapping to `"442:443"`. In that case, **you must specify the port** in your URLs (e.g. `https://sv90073.hrz.uni-giessen.de:442/widget.js`).



## 4. CORS CONFIGURATION

The backend (`server/index.mjs`, and the Vite dev proxy) sets CORS headers on every `/api/*` response, including the `OPTIONS` preflight. The list of allowed origins is configured via the **`CORS_ALLOWED_ORIGINS`** environment variable (comma-separated, exact match — never `*`):

```bash
# .env on the staging host
KI_API_KEY=…
CORS_ALLOWED_ORIGINS=https://www.uni-giessen.de,https://uni-giessen.de
```

When to set which origin:
* **Embedding on the same host** (e.g. the staging test page under `/test-widget/`, or the admin panel): the `/api/chat` call is **same-origin** and goes through Nginx — no CORS needed.
* **Embedding on a different host** (e.g. a Plone page at `https://www.uni-giessen.de` that loads `widget.js` from the staging/widget host): add that page's exact origin to `CORS_ALLOWED_ORIGINS`. The match is exact — `https://www.uni-giessen.de` ≠ `https://uni-giessen.de`, so list every variant you need.

The backend then echoes the matched origin back, e.g.:
```http
Access-Control-Allow-Origin: https://www.uni-giessen.de
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
Vary: Origin
```

In the **Vite dev proxy** any `http(s)://localhost[:port]` origin is additionally allowed, so local cross-port testing works without extra configuration.

> [!NOTE]
> `widget.js` itself is served with `Cache-Control: no-cache, no-store, must-revalidate` (see `nginx.staging.conf`), so updates to the central loader reach all embeddings without a caching delay.

### Rate limiting

`/api/*` is rate-limited per client IP at two levels:
* **Nginx** (`limit_req zone=api_limit ... burst=20 nodelay`, returns `429`) — coarse flood protection at the edge.
* **Backend** (`server/index.mjs`) — defense-in-depth, also active if the backend is reached directly. Tune via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` (default 30 requests / 60 s); it reads `X-Real-IP` set by Nginx to identify the client. Exceeding the quota returns `429` with a `Retry-After` header.

