import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { BottomNavBar } from "./components/BottomNavBar";
import { Sidebar } from "./components/Sidebar";
import { TopAppBar } from "./components/TopAppBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LoginPage } from "./pages/LoginPage";
import { StandaloneWidgetPage } from "./pages/StandaloneWidgetPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { WidgetConfigPage } from "./pages/WidgetConfigPage";
import { WidgetEmbedPage } from "./pages/WidgetEmbedPage";
import { WidgetConversationsPage } from "./pages/WidgetConversationsPage";
import { WidgetDashboardPage } from "./pages/WidgetDashboardPage";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-row">
      <Sidebar onLogout={logout} />
      <div className="flex-grow flex flex-col lg:pl-64 min-w-0">{children}</div>
      <BottomNavBar />
    </div>
  );
}

function App() {
  const location = useLocation();

  // Public standalone widget page - no admin login required
  if (location.pathname.startsWith("/w/")) {
    return (
      <Routes>
        <Route path="/w/:id" element={<StandaloneWidgetPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected app routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <TopAppBar title="Dashboard Übersicht" />
              <DashboardPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/widgets/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <WidgetConfigPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/widgets/:id/einbetten"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <WidgetEmbedPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/widgets/:id/gespraeche"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <WidgetDashboardPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/widgets/:id/gespraeche/:convId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <WidgetConversationsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistiken"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <StatisticsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Unknown paths fall back to the dashboard, which enforces auth. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
