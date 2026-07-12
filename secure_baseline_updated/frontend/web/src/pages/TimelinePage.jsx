import { useMemo, useState } from "react";
import { Calendar, Filter, Download, ChevronDown } from "lucide-react";
import Header from "../components/Header";
import DriftTimeline from "../components/DriftTimeline";
import { useApp } from "../context/AppContext";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

const SEVERITY_DOT = {
  ALL:      "bg-[#8B95A1]",
  CRITICAL: "bg-red-500",
  HIGH:     "bg-red-400",
  MEDIUM:   "bg-amber-400",
  LOW:      "bg-emerald-500",
};

export default function TimelinePage() {
  const { drifts } = useApp();
  const [severity, setSeverity] = useState("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(
    () => (severity === "ALL" ? drifts : drifts.filter((d) => d.severity === severity)),
    [drifts, severity]
  );

  function exportJson() {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentineldna-drift-timeline-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Drift Timeline" subtitle="Real-time configuration drift and security changes" />

      {/* Toolbar */}
      <div className="px-6 md:px-8 pt-5 pb-0 flex flex-wrap items-center gap-3">
        {/* Date chip */}
        <span className="inline-flex items-center gap-2 rounded-lg border border-[#E8EAED] bg-white px-3.5 py-2 text-[13px] text-[#1A2332] font-medium shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-[#8B95A1]" />
          {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </span>

        {/* Severity filter */}
        <div className="relative">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-label="Filter by severity"
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8EAED] bg-white px-3.5 py-2 text-[13px] text-[#1A2332] font-medium shadow-sm hover:border-[#1B7B6F] transition-colors duration-150"
          >
            <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[severity]}`} />
            {severity === "ALL" ? "All Severities" : severity}
            <ChevronDown className={`w-3.5 h-3.5 text-[#8B95A1] transition-transform duration-150 ${filtersOpen ? "rotate-180" : ""}`} />
            <Filter className="w-3.5 h-3.5 text-[#8B95A1]" />
          </button>

          {filtersOpen && (
            <div className="absolute z-20 mt-1.5 w-48 rounded-xl border border-[#E8EAED] bg-white shadow-xl py-1.5 animate-fade-in">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setSeverity(s); setFiltersOpen(false); }}
                  className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-[13px] hover:bg-[#F4F6F8] transition-colors ${
                    severity === s ? "text-[#1B7B6F] font-semibold" : "text-[#1A2332]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[s]}`} />
                  {s === "ALL" ? "All severities" : s}
                  {severity === s && <span className="ml-auto text-[#1B7B6F]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Event count */}
        <span className="text-[13px] text-[#8B95A1]">
          <span className="font-semibold text-[#1A2332]">{filtered.length}</span> events
        </span>

        {/* Export */}
        <button
          onClick={exportJson}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#1B7B6F] text-[#1B7B6F] bg-white px-3.5 py-2 text-[13px] font-semibold hover:bg-[#EDF7F6] transition-colors duration-150 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export JSON
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 max-w-3xl">
        <DriftTimeline
          drifts={filtered}
          title={`Drift Timeline · ${filtered.length} event${filtered.length !== 1 ? "s" : ""}`}
        />
      </div>
    </div>
  );
}
