import { AlertTriangle, GitBranch, Shield } from "lucide-react";
import Header from "../components/Header";
import AttackGraph from "../components/AttackGraph";
import { useApp } from "../context/AppContext";

export default function AttackGraphPage() {
  const { graph } = useApp();

  const stats = [
    { label: "Nodes", value: graph.nodes?.length ?? 0, icon: Shield },
    { label: "Edges", value: graph.edges?.length ?? 0, icon: GitBranch },
    { label: "Blast Radius", value: `${graph.blast_radius ?? 0} hops`, icon: AlertTriangle },
    { label: "Critical Path", value: `${graph.critical_path?.length ?? 0} steps`, icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header
        title="Attack Graph"
        subtitle="Blast-radius visualization and exploit path analysis"
      />
      <div className="p-6 md:p-8 space-y-5">
        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-[#E8EAED] shadow-sm px-5 py-4">
              <div className="text-[11px] font-semibold text-[#8B95A1] uppercase tracking-wider mb-1.5">{label}</div>
              <div className="text-2xl font-bold font-mono text-[#1A2332]">{value}</div>
            </div>
          ))}
        </div>

        {/* Full graph */}
        <AttackGraph graph={graph} height={520} />
      </div>
    </div>
  );
}
