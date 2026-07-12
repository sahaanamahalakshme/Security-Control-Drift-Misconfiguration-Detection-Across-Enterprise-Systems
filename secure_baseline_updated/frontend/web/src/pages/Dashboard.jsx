import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ControlHeatmap from '../components/ControlHeatmap'
import DriftTimeline from '../components/DriftTimeline'
import AttackGraph from '../components/AttackGraph'
import { useApp } from '../context/AppContext'
import {
  AlertTriangle, CheckCircle2, ShieldAlert,
  Clock, ArrowRight, BookOpen, ArrowUpRight
} from 'lucide-react'

export default function Dashboard() {
  const { systems, drifts, graph, summary, scenario, liveBackend } = useApp()
  const navigate = useNavigate()
  const isCrisis  = !liveBackend && scenario === 'crisis'
  const isOptimal = !liveBackend && scenario === 'optimal'

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header
        title="Dashboard"
        subtitle="Real-time view of your security control health and environment"
        showScenarioSwitcher
      />

      <div className="p-6 md:p-8 space-y-6">

        {/* ── Optimal Banner ─────────────────────────────────────────── */}
        {isOptimal && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white border border-emerald-200 rounded-xl px-5 py-3 shadow-sm">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> All Systems Operational
            </span>
            <span className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> Data Ingestion Healthy
            </span>
            <span className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Sensors Online <span className="font-mono font-bold">{summary.total_controls}/{summary.total_controls}</span>
            </span>
          </div>
        )}

        {/* ── Crisis Banner ───────────────────────────────────────────── */}
        {isCrisis && (
          <div className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 px-5 py-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-bold text-red-700 text-sm uppercase tracking-wide">Crisis Mode Active</span>
              </div>
              <span className="text-[11px] font-semibold bg-red-100 text-red-700 rounded-full px-2.5 py-1 border border-red-200">
                System Under Active Threat
              </span>
              <button
                onClick={() => navigate('/incidents')}
                className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3.5 py-2 transition-colors duration-150"
              >
                View Incident Details <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED]">
              <BannerStat
                icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                label={`${summary.critical} Critical Controls`}
                sub="Immediate action required"
              />
              <BannerStat
                icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
                label="Widespread Compromise"
                sub="Multiple attack vectors active"
              />
              <BannerStat
                icon={<Clock className="w-4 h-4 text-red-500" />}
                label={`Active since ${drifts[drifts.length - 1]?.timestamp
                  ? new Date(drifts[drifts.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}`}
                sub="Ongoing incident window"
              />
            </div>
          </div>
        )}

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <SummaryCards summary={summary} />

        {/* ── Quick Actions Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View all drifts', to: '/timeline', color: 'text-[#1B7B6F]' },
            { label: 'Attack graph', to: '/attack-graph', color: 'text-[#1B7B6F]' },
            { label: 'Remediation', to: '/remediation', color: 'text-[#1B7B6F]' },
            { label: 'Risk analytics', to: '/risk-analytics', color: 'text-[#1B7B6F]' },
          ].map(({ label, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex items-center justify-between bg-white border border-[#E8EAED] hover:border-[#1B7B6F] hover:shadow-md rounded-xl px-4 py-3 transition-all duration-150 group"
            >
              <span className={`text-[13px] font-semibold ${color}`}>{label}</span>
              <ArrowUpRight className={`w-3.5 h-3.5 ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />
            </button>
          ))}
        </div>

        {/* ── Three-panel grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <ControlHeatmap systems={systems} compact title="Control Health Heatmap" />
          <DriftTimeline  drifts={drifts}  compact title="Recent Drifts" />
          <AttackGraph    graph={graph}    compact />
        </div>

        {/* ── Optimal posture footer ──────────────────────────────────── */}
        {isOptimal && (
          <div className="bg-white rounded-xl border border-emerald-200 shadow-sm px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#2ECC71]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A2332]">System Posture: Excellent</div>
              <div className="text-[12px] text-[#8B95A1] mt-0.5">
                Average control health at {summary.avg_health}% · {summary.critical} critical findings
              </div>
            </div>
          </div>
        )}

        {/* ── Crisis playbook footer ──────────────────────────────────── */}
        {isCrisis && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="text-sm font-bold text-[#1A2332]">Response Playbook Available</div>
              <div className="text-[12px] text-[#8B95A1] mt-0.5">
                Follow the incident response procedure for widespread compromise scenarios.
              </div>
            </div>
            <button
              onClick={() => navigate('/remediation')}
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-[#1B7B6F] hover:bg-[#145F56] rounded-lg px-4 py-2.5 transition-colors duration-150"
            >
              <BookOpen className="w-4 h-4" /> View Response Playbook
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

function BannerStat({ icon, label, sub }) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-[13px] font-semibold text-[#1A2332]">{label}</div>
        <div className="text-[11px] text-[#8B95A1] mt-0.5">{sub}</div>
      </div>
    </div>
  )
}
