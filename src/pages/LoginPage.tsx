import { useState, type FormEvent } from "react";
import { Icon } from "../components/Icon";

interface LoginPageProps {
  onLogin: (rememberMe: boolean) => void;
}

const PASSWORD_MIN_LENGTH = 8;

function getPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Das Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Das Passwort muss Buchstaben und Zahlen enthalten.";
  }
  return null;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const error = getPasswordError(password);
    setPasswordError(error);
    if (error) return;
    onLogin(rememberMe);
  };

  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetSent(true);
  };

  if (isForgotPassword) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-gutter">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 mb-8">
            <Icon name="smart_toy" className="text-primary" style={{ fontSize: 40 }} />
            <h1 className="text-headline-md font-bold text-primary">ChatBot Admin</h1>
            <p className="text-on-surface-variant font-body-base text-sm">Passwort zurücksetzen</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-stack-sm">
            {resetSent ? (
              <div className="flex flex-col items-center gap-3 text-center py-2">
                <Icon name="mark_email_read" className="text-primary" style={{ fontSize: 32 }} />
                <p className="text-sm text-on-surface">
                  Falls ein Konto mit <span className="font-semibold">{resetEmail}</span> existiert, wurde ein Link
                  zum Zurücksetzen des Passworts gesendet.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-stack-sm">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface-variant" htmlFor="reset-email">
                    E-Mail
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    placeholder="name@beispiel.de"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary px-6 py-3 rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all font-label-sm text-label-sm flex items-center justify-center gap-2"
                >
                  <Icon name="send" className="text-[18px]" />
                  Link senden
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setResetSent(false);
                setResetEmail("");
              }}
              className="w-full text-center text-primary hover:underline text-sm"
            >
              Zurück zur Anmeldung
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-gutter">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <Icon name="smart_toy" className="text-primary" style={{ fontSize: 40 }} />
          <h1 className="text-headline-md font-bold text-primary">ChatBot Admin</h1>
          <p className="text-on-surface-variant font-body-base text-sm">Melden Sie sich an, um fortzufahren</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-stack-sm"
        >
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant" htmlFor="login-email">
              E-Mail
            </label>
            <input
              id="login-email"
              type="email"
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="name@beispiel.de"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-on-surface-variant" htmlFor="login-password">
              Passwort
            </label>
            <input
              id="login-password"
              type="password"
              className={`w-full px-4 py-3 bg-surface border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all ${
                passwordError ? "border-red-500 focus:border-red-500" : "border-outline-variant focus:border-primary"
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (passwordError) setPasswordError(getPasswordError(event.target.value));
              }}
              required
            />
            {passwordError ? (
              <p className="text-xs text-red-500">{passwordError}</p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Mindestens {PASSWORD_MIN_LENGTH} Zeichen, mit Buchstaben und Zahlen.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-on-surface-variant">
              <input
                type="checkbox"
                className="rounded border-outline-variant text-primary focus:ring-primary"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Angemeldet bleiben
            </label>
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-primary hover:underline"
            >
              Passwort vergessen?
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary px-6 py-3 rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all font-label-sm text-label-sm flex items-center justify-center gap-2"
          >
            <Icon name="login" className="text-[18px]" />
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
