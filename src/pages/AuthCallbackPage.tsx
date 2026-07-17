import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type AuthUser } from "../auth/AuthContext";
import { CircleAlert } from "lucide-react";
import { AuthLayout, Button, Spinner } from "@ki4jlu/design-system";

type ParsedCallback = { token: string; user: AuthUser } | { error: string };

/** Decodes the #oidc=<base64url({token,user})> fragment the backend appends. */
function parseCallbackFragment(): ParsedCallback {
  const hash = window.location.hash;
  if (!hash.startsWith("#oidc=")) {
    return { error: "Kein Anmelde-Token empfangen." };
  }
  try {
    const json = decodeBase64Url(hash.slice("#oidc=".length));
    const payload = JSON.parse(json) as { token: string; user: AuthUser };
    if (!payload.token || !payload.user) throw new Error("incomplete");
    return { token: payload.token, user: payload.user };
  } catch {
    return { error: "Anmelde-Token konnte nicht verarbeitet werden." };
  }
}

/**
 * Handles the post-OIDC redirect from the backend broker.
 *
 * After Keycloak authenticates the user, the backend exchanges the code for a
 * JWT and redirects here with the session in the URL **fragment**:
 *
 *   /auth/callback#oidc=<base64url({ token, user })>
 *
 * Fragments never reach the server, so the token stays out of access logs.
 * This page decodes the fragment, stores the session, and navigates into the app.
 *
 * Route: /auth/callback
 */
export function AuthCallbackPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  // Derive the parse result during render (deterministic from the URL fragment);
  // the effect below performs only the side effects when parsing succeeded.
  const parsed = useMemo(() => parseCallbackFragment(), []);
  const error = "error" in parsed ? parsed.error : null;

  useEffect(() => {
    if ("error" in parsed) return;
    setSession(parsed.token, parsed.user);
    // Strip the fragment from history, then enter the app.
    window.history.replaceState({}, document.title, window.location.pathname);
    navigate("/", { replace: true });
  }, [parsed, setSession, navigate]);

  if (error) {
    return (
      <AuthLayout title="Anmeldung fehlgeschlagen">
        <div className="flex flex-col items-center gap-4 text-center">
          <CircleAlert className="text-error" style={{ fontSize: 40 }} width="1em" height="1em" aria-hidden />
          <p className="text-sm text-on-surface-variant">{error}</p>
          <Button onClick={() => navigate("/login", { replace: true })}>
            Zurück zur Anmeldung
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Anmeldung wird abgeschlossen…">
      <div className="flex flex-col items-center gap-4 text-primary">
        <Spinner size="lg" />
        <p className="text-sm text-on-surface-variant">Anmeldung wird verarbeitet…</p>
      </div>
    </AuthLayout>
  );
}

/** Decodes a base64url string (no padding) to a UTF-8 string. */
function decodeBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
