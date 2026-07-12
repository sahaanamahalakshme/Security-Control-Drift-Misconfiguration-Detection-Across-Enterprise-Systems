import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import { SeverityBadge } from "../components/Badges";
import { ArrowLeft, Calendar, ShieldAlert, Wrench, Layers, Clock } from "lucide-react";
import { useApp, normalizeDrift } from "../context/AppContext";
import api from "../api/client";

export default function DriftDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drifts } = useApp();
  const [drift, setDrift] = useState(() => drifts.find((d) => d.drift_id === id));

  useEffect(() => {
    if (drift) return;
    api.getDriftById(id).then((res) => res.data && setDrift(normalizeDrift(res.data)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!drift) {
    return (
      <div className="min-h-screen bg-[#F4F6F8]">
        <Header title="Drift not found" />
        <div className="p-6 md:p-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1B7B6F] hover:text-[#145F56] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="mt-6 bg-white rounded-xl border border-[#E8EAED] shadow-sm p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-[#C8D6D4] mx-auto mb-3" />
            <p className="text-sm text-[#8B95A1]">Drift event not found or not yet generated.</p>
            <p className="text-xs text-[#8B95A1] mt-1">Run the detection pipeline from Settings to generate drift data.</p>
          </div>
        </div>
      </div>
    );
  }

  const remediation = drift.remediation_steps?.length
    ? drift.remediation_steps
    : [
        "Review the affected resource configuration.",
        "Compare current state against the expected baseline.",
        "Apply the approved configuration and re-run detection.",
        "Confirm the control returns to a healthy state.",
      ];

  const affected = drift.affected_resources?.length
    ? drift.affected_resources
    : [`resource-${drift.control_id?.toLowerCase()}-01`, `resource-${drift.control_id?.toLowerCase()}-02`];

  const severityBorderColor = {
    CRITICAL: "border-l-red-500",
    HIGH: "border-l-red-400",
    MEDIUM: "border-l-amber-400",
    LOW: "border-l-emerald-400",
    INFO: "border-l-teal-500",
  }[drift.severity] || "border-l-[#8B95A1]";

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Drift Event Detail" subtitle="Comprehensive drift event analysis" />

      <div className="p-6 md:p-8 max-w-4xl space-y-1">
        {/* Back nav */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8B95A1] hover:text-[#1B7B6F] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Back to Timeline
        </button>

        {/* Main Card */}
        <div className={`bg-white rounded-xl border border-[#E8EAED] shadow-sm border-l-4 ${severityBorderColor} overflow-hidden`}>

          {/* Card Header */}
          <div className="px-6 py-5 border-b border-[#E8EAED]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#1A2332] leading-snug">{drift.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-[11px] font-mono text-[#8B95A1]">ID: {drift.drift_id}</span>
                    {drift.timestamp && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8B95A1]">
                        <Calendar className="w-3 h-3" />
                        {new Date(drift.timestamp).toLocaleString()}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#8B95A1]">
                      <Clock className="w-3 h-3" />
                      {drift.detected_by || "Secure Baseline Drift Detection Engine"}
                    </span>
                  </div>
                </div>
              </div>
              <SeverityBadge severity={drift.severity} />
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED] border-b border-[#E8EAED]">
            <MetaCell label="Control" value={drift.control} />
            <MetaCell label="Category" value={drift.category || "—"} />
            <MetaCell label="Description" value={drift.description || "Configuration deviated from approved baseline."} />
          </div>

          {/* Config comparison */}
          <div className="px-6 py-5 border-b border-[#E8EAED]">
            <h3 className="text-[11px] font-semibold text-[#8B95A1] uppercase tracking-wider mb-3">Configuration Comparison</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Expected</div>
                <div className="text-[13px] font-mono text-[#1A2332] break-all leading-relaxed">{drift.expected}</div>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2">Actual</div>
                <div className="text-[13px] font-mono text-[#1A2332] break-all leading-relaxed">{drift.actual}</div>
              </div>
            </div>
          </div>

          {/* Resources + Remediation */}
          <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED]">
            {/* Affected Resources */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#1B7B6F]" />
                <h3 className="text-[11px] font-semibold text-[#8B95A1] uppercase tracking-wider">
                  Affected Resources ({affected.length})
                </h3>
              </div>
              <ul className="space-y-2">
                {affected.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] font-mono text-[#4B5563] bg-[#F8F9FA] rounded-lg px-3 py-2 border border-[#E8EAED]">
                    <span className="text-[#1B7B6F] font-bold shrink-0">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Remediation Steps */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-[#1B7B6F]" />
                <h3 className="text-[11px] font-semibold text-[#8B95A1] uppercase tracking-wider">Remediation Steps</h3>
              </div>
              <ol className="space-y-2.5">
                {remediation.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-[#4B5563]">
                    <span className="w-5 h-5 rounded-full bg-[#1B7B6F]/10 text-[#1B7B6F] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border border-[#1B7B6F]/20">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="px-6 py-4">
      <div className="text-[10px] font-semibold text-[#8B95A1] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] text-[#1A2332] font-medium leading-snug">{value}</div>
    </div>
  );
}
