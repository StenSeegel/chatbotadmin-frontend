import { BottomNavBar } from "./components/BottomNavBar";
import { Sidebar } from "./components/Sidebar";
import { TopAppBar } from "./components/TopAppBar";
import { DashboardPage } from "./pages/DashboardPage";

function App() {
  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-row">
      <Sidebar />
      <div className="flex-grow flex flex-col lg:pl-64 min-w-0">
        <TopAppBar title="Dashboard Übersicht" />
        <DashboardPage />
      </div>
      <BottomNavBar />
    </div>
  );
}

export default App;
