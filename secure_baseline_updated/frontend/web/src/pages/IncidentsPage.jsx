import { ShieldAlert, GitBranch, BookOpen, AlertOctagon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SectionCard, { EmptyState } from '../components/SectionCard'
import { VerdictBadge, timeAgo } from '../components/Badges'
import { useEndpoint } from '../hooks/useEndpoint'
import api from '../api/client'
import { TRIBUNAL_VERDICTS, TIME_MACHINE, STORYTELLING } from '../data/mockData'
import { useApp } from '../context/AppContext'

const VERDICT_COLORS = {
  BLOCK:    'border-l-red-500',
  ESCALATE: 'border-l-amber-400',
  ALLOW:    'border-l-emerald-400',
}

export default function IncidentsPage() {
  const navigate = useNavigate()
  const { drifts } = useApp()
  const tribunal   = useEndpoint(api.getTribunal,    TRIBUNAL_VERDICTS)
  const timeMachine = useEndpoint(api.getTimeMachine, TIME_MACHINE)
  const stories    = useEndpoint(api.getStorytelling, STORYTELLING)

  const verdicts   = Array.isArray(tribunal.data)    ? tribunal.data    : tribunal.data?.verdicts   ?? tribunal.data?.Verdicts   ?? []
  const incidents  = Array.isArray(timeMachine.data) ? timeMachine.data : timeMachine.data?.incidents ?? timeMachine.data?.Incidents ?? []
  const narratives = Array.isArray(stories.data)     ? stories.data     : stories.data?.stories     ?? stories.data?.Stories     ?? []

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Incidents" subtitle="AI Tribunal verdicts, compound incidents, and generated narratives" />

      <div className="p-6 md:p-8 space-y-5">

        {/* AI Tribunal Verdicts */}
        <SectionCard
          title="AI Tribunal Verdicts"
          subtitle="Automated ALLOW / ESCALATE / BLOCK decisions for each drift event"
          isLive={tribunal.isLive}
          count={verdicts.length}
          icon={ShieldAlert}
        >
          {verdicts.length === 0 ? (
            <EmptyState text="No verdicts available. Run the intelligence engine from Settings." icon={ShieldAlert} />
          ) : (
            <div className="space-y-2">
              {verdicts.map((v, i) => {
                const control = v.control ?? v.control_id ?? 'Unknown control'
                const driftId = v.drift_id ?? v.driftId
                const accentColor = VERDICT_COLORS[v.verdict] || 'border-l-[#E8EAED]'
                return (
                  <button
                    key={v.drift_id ?? i}
                    onClick={() => driftId && navigate(`/drifts/${driftId}`)}
                    className={`w-full text-left flex items-start gap-3 border border-[#E8EAED] border-l-4 ${accentColor} rounded-lg p-3.5 hover:border-[#1B7B6F] hover:shadow-md transition-all duration-150 bg-white group`}
                  >
                    <VerdictBadge verdict={v.verdict ?? 'ESCALATE'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#1A2332]">{control}</div>
                      <p className="text-[12px] text-[#8B95A1] mt-0.5 leading-relaxed">{v.rationale ?? v.reason ?? 'No rationale provided by the tribunal.'}</p>
                    </div>
                    {typeof v.confidence === 'number' && (
                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-mono font-semibold text-[#1A2332]">{Math.round(v.confidence * 100)}%</div>
                        <div className="text-[10px] text-[#8B95A1]">confidence</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* Compound Incidents + Narratives */}
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard
            title="Compound Incidents"
            subtitle="Time Machine — drifts correlated across time windows"
            isLive={timeMachine.isLive}
            count={incidents.length}
            icon={GitBranch}
          >
            {incidents.length === 0 ? (
              <EmptyState text="No compound incidents detected." icon={GitBranch} />
            ) : (
              <div className="space-y-3">
                {incidents.map((inc, i) => (
                  <div key={inc.incident_id ?? i} className="border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-2.5 mb-2">
                      <GitBranch className="w-3.5 h-3.5 text-[#1B7B6F] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[13px] font-semibold text-[#1A2332]">{inc.title ?? 'Correlated incident'}</span>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-[#8B95A1]">Spans {inc.span_days ?? '—'} days</span>
                          {inc.severity && (
                            <span className="text-[11px] font-semibold text-[#8B95A1]">Severity: {inc.severity}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(inc.related_drifts ?? []).map((dId) => (
                        <button
                          key={dId}
                          onClick={() => navigate(`/drifts/${dId}`)}
                          className="text-[11px] font-mono px-2 py-1 rounded-md bg-[#F4F6F8] text-[#8B95A1] hover:bg-[#EDF7F6] hover:text-[#1B7B6F] border border-[#E8EAED] transition-colors duration-150"
                        >
                          {dId}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Incident Narratives"
            subtitle="AI-generated summaries for stakeholder briefings"
            isLive={stories.isLive}
            count={narratives.length}
            icon={BookOpen}
          >
            {narratives.length === 0 ? (
              <EmptyState text="No narratives generated yet. Run the intelligence engine from Settings." icon={BookOpen} />
            ) : (
              <div className="space-y-3">
                {narratives.map((n, i) => (
                  <div key={n.incident_id ?? i} className="border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#1B7B6F] shrink-0" />
                      <span className="text-[11px] font-mono text-[#8B95A1]">{n.incident_id}</span>
                    </div>
                    <p className="text-[13px] text-[#4B5563] leading-relaxed">{n.narrative}</p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Footer */}
        {drifts.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <AlertOctagon className="w-3.5 h-3.5 text-[#8B95A1]" />
            <p className="text-[12px] text-[#8B95A1]">
              Referencing <span className="font-semibold text-[#1A2332]">{drifts.length}</span> known drift events
              · updated {timeAgo(drifts[0]?.timestamp)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
