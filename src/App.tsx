import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { BottomNavBar } from "./components/BottomNavBar";
import { Sidebar } from "./components/Sidebar";
import { TopAppBar } from "./components/TopAppBar";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { WidgetConfigPage } from "./pages/WidgetConfigPage";

const AUTH_STORAGE_KEY = "chatbotadmin.rememberMe";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_STORAGE_KEY) === "true");

  const handleLogin = (rememberMe: boolean) => {
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-row">
      <Sidebar />
      <div className="flex-grow flex flex-col lg:pl-64 min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <TopAppBar title="Dashboard Übersicht" />
                <DashboardPage />
              </>
            }
          />
          <Route path="/widgets/:id" element={<WidgetConfigPage />} />
        </Routes>
      </div>
      <BottomNavBar />
    </div>
  );
}

export default App;
