import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { AgentsPage } from "./pages/AgentsPage";
import { AgentConfigPage } from "./pages/AgentConfigPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LoginPage } from "./pages/LoginPage";
import { StandaloneWidgetPage } from "./pages/StandaloneWidgetPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { WidgetConfigPage } from "./pages/WidgetConfigPage";
import { WidgetEmbedPage } from "./pages/WidgetEmbedPage";
import { WidgetConversationsPage } from "./pages/WidgetConversationsPage";
import { WidgetDashboardPage } from "./pages/WidgetDashboardPage";

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

      {/* Protected app routes — one layout route provides shell + guard. */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/widgets/:id" element={<WidgetConfigPage />} />
        <Route path="/widgets/:id/einbetten" element={<WidgetEmbedPage />} />
        <Route path="/widgets/:id/gespraeche" element={<WidgetDashboardPage />} />
        <Route path="/widgets/:id/gespraeche/:convId" element={<WidgetConversationsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentConfigPage />} />
        <Route path="/statistiken" element={<StatisticsPage />} />
      </Route>

      {/* Unknown paths fall back to the dashboard, which enforces auth. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
