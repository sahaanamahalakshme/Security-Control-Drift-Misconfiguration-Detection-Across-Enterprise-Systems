import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Dashboard from "./pages/Dashboard";
import ControlsPage from "./pages/ControlsPage";
import TimelinePage from "./pages/TimelinePage";
import AttackGraphPage from "./pages/AttackGraphPage";
import DriftDetailPage from "./pages/DriftDetailPage";
import IncidentsPage from "./pages/IncidentsPage";
import RiskAnalyticsPage from "./pages/RiskAnalyticsPage";
import RemediationPage from "./pages/RemediationPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="flex-1 min-w-0 pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/controls" element={<ControlsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/attack-graph" element={<AttackGraphPage />} />
            <Route path="/drifts/:id" element={<DriftDetailPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/risk-analytics" element={<RiskAnalyticsPage />} />
            <Route path="/remediation" element={<RemediationPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </AppProvider>
  );
}
