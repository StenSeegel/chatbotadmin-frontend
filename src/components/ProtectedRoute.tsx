import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Ban } from "lucide-react";
import { AuthLayout } from "@ki4jlu/design-system";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: require a specific backend role to access this route. */
  requiredRole?: string;
}

/**
 * Route guard. Redirects unauthenticated users to /login (preserving the
 * intended path in router state). Superadmins bypass the role check.
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== "superadmin") {
    return (
      <AuthLayout
        title="Zugriff verweigert"
        footer={
          <Link to="/" className="underline underline-offset-4 hover:text-on-surface">
            Zur Startseite
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Ban className="text-error" style={{ fontSize: 40 }} width="1em" height="1em" aria-hidden />
          <p className="text-sm text-on-surface-variant">
            Sie benötigen die Rolle <strong>{requiredRole}</strong>, um auf diese Seite zuzugreifen.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return <>{children}</>;
}
