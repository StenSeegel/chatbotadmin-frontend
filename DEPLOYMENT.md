# Chatbot Widget - Deployment & Testing Guide

This guide outlines how to embed, test, and verify the Chatbot Widget both in your local development environment and on the staging server.

---

## 1. TESTING LOCALLY (localhost)

For local testing, the project runs a dual-container setup:
1. **`local-frontend`**: Serves the Chatbot Admin UI and hosts the widget loader script (`/widget.js`) at **`http://localhost:8081`**.
2. **`widget-test-site`**: A lightweight Nginx container serving a mockup JLU Gießen portal page at **`http://localhost:8082`**.

### Browser Links
* **Admin UI:** [http://localhost:8081](http://localhost:8081)
* **Widget Mock Portal:** [http://localhost:8082](http://localhost:8082)

### Quick Start
To start the local testing stack with live rebuilding:
```bash
docker compose up local-frontend widget-test-site -d --build
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
   * Ask the bot mock questions (e.g., *"Was ist die JLU?"* or *"Semesterticket"*) to verify context-aware replies.
4. **Access the Admin Panel:** Manage and configure widgets at [http://localhost:8081](http://localhost:8081).

---

## 2. TESTING ON STAGING SERVER (sv90073.hrz.uni-giessen.de)

On the staging environment hosted at **`sv90073.hrz.uni-giessen.de`**, the widget script is served globally, allowing you to embed it on external test pages or mock CMS sites.

### Staging Architecture
* **Admin Frontend / Widget Script:** `http://sv90073.hrz.uni-giessen.de:442/widget.js`
* **Staging Test Site:** `http://sv90073.hrz.uni-giessen.de:8082`

### Browser Links
* **Staging Admin UI:** [http://sv90073.hrz.uni-giessen.de:442](http://sv90073.hrz.uni-giessen.de:442)
* **Staging Widget Mock Portal:** [http://sv90073.hrz.uni-giessen.de:8082](http://sv90073.hrz.uni-giessen.de:8082)

### Running the Stack on Staging
1. SSH into the staging server:
   ```bash
   ssh user@sv90073.hrz.uni-giessen.de
   ```
2. Navigate to your project directory and pull the latest production images from the GitHub Container Registry:
   ```bash
   docker compose pull
   ```
3. Run the container services in background mode:
   ```bash
   docker compose up -d
   ```
   *This starts the `chatbotadmin-frontend` on port `442` (HTTP alternate) and the `widget-test-site` mockup page on port `8082`.*

### Embedding the Widget on Staging Pages
To test the widget on staging CMS environments or static staging portals:

1. **Add the HTML Placeholder Container:**
   Paste the following passive `<div>` container into the page content (e.g., via rich text editor or raw HTML block). Editors do not need to paste script tags here:
   ```html
   <div class="chatbot-widget"
        data-widget-id="support-bot"
        data-kb="jlu-staging-2026"
        data-routing="public-widget"
        data-lang="de"></div>
   ```
2. **Include the Global Loader Script:**
   Include the widget script **once globally** in the staging portal's main theme (e.g., in the `<head>` or before `</body>`):
   ```html
   <script src="http://sv90073.hrz.uni-giessen.de:442/widget.js" defer></script>
   ```

### Staging Security Notes (SSL & CORS)
* **HTTP Connection:** Since HTTPS is currently disabled on staging, all connections must use HTTP over port `442`. Make sure your testing environment allows loading HTTP scripts (you may need to allow insecure/mixed content in your browser if the embedding site itself is served over HTTPS).
* **CORS Configurations:** If the staging widget executes backend API calls (e.g., to fetch active configs or rules), the staging backend must respond with proper CORS headers allowing your test site's domain:
  ```http
  Access-Control-Allow-Origin: http://sv90073.hrz.uni-giessen.de:8082
  Access-Control-Allow-Methods: GET, POST, OPTIONS
  ```
