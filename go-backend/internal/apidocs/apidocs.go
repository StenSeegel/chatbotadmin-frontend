// Package apidocs serves the hand-maintained OpenAPI description of this
// backend (openapi.yaml) and renders it with the Scalar API reference UI at
// /api/docs. The Scalar browser bundle is vendored and embedded (scalar.min.js,
// @scalar/api-reference 1.62.7) so the docs work offline and no visitor's
// browser ever calls out to a CDN. To upgrade Scalar, replace scalar.min.js
// with a newer dist/browser/standalone.js from the npm package.
package apidocs

import (
	_ "embed"
	"net/http"
)

//go:embed openapi.yaml
var specYAML []byte

//go:embed scalar.min.js
var scalarJS []byte

// page bootstraps Scalar against the spec URL. Everything is same-origin:
// the JS bundle and the spec are served by the two handlers below.
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CampusAgents API Reference</title>
</head>
<body>
  <div id="app"></div>
  <script src="/api/docs/scalar.js"></script>
  <script>Scalar.createApiReference('#app', { url: '/api/openapi.yaml' })</script>
</body>
</html>
`

// UI handles GET /api/docs — the Scalar reference page.
func UI(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(page))
}

// Raw returns the embedded OpenAPI document. The router feeds it to the
// spec-validation middleware (internal/specmw), so the served spec and the
// enforced spec are always the same bytes.
func Raw() []byte {
	return specYAML
}

// Spec handles GET /api/openapi.yaml — the raw OpenAPI document, for Scalar
// and for tooling (codegen, Postman/Bruno imports, linters).
func Spec(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
	_, _ = w.Write(specYAML)
}

// ScalarJS handles GET /api/docs/scalar.js — the vendored Scalar bundle. The
// bundle only changes when the binary does, so a day of client caching is safe.
func ScalarJS(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	_, _ = w.Write(scalarJS)
}
