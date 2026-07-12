import Header from "../components/Header";
import ControlHeatmap from "../components/ControlHeatmap";
import { useApp } from "../context/AppContext";

export default function ControlsPage() {
  const { systems } = useApp();
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header
        title="Control Health"
        subtitle="Real-time overview of your security control health across all systems"
      />
      <div className="p-6 md:p-8">
        <ControlHeatmap systems={systems} />
      </div>
    </div>
  );
}
