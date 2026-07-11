import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ControlDetail from './pages/ControlDetail';
import DriftDetail from './pages/DriftDetail';
import HeatmapDetail from './pages/HeatmapDetail';
import TimelineDetail from './pages/TimelineDetail';
import AttackGraphDetail from './pages/AttackGraphDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="controls/:id" element={<ControlDetail />} />
          <Route path="drifts/:id" element={<DriftDetail />} />
          <Route path="heatmap" element={<HeatmapDetail />} />
          <Route path="timeline" element={<TimelineDetail />} />
          <Route path="attack-graph" element={<AttackGraphDetail />} />
          <Route path="tasks" element={<div className="p-4">Tasks Page (Coming Soon)</div>} />
          <Route path="calendar" element={<div className="p-4">Calendar Page (Coming Soon)</div>} />
          <Route path="analytics" element={<div className="p-4">Analytics Page (Coming Soon)</div>} />
          <Route path="team" element={<div className="p-4">Team Page (Coming Soon)</div>} />
          <Route path="settings" element={<div className="p-4">Settings Page (Coming Soon)</div>} />
          <Route path="help" element={<div className="p-4">Help Page (Coming Soon)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
