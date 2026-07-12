import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { SeverityBadge, timeAgo } from './Badges'

const DOT_COLOR = {
  CRITICAL: 'bg-[#E74C3C] ring-red-100',
  HIGH:     'bg-[#E74C3C] ring-red-100',
  MEDIUM:   'bg-[#F39C12] ring-amber-100',
  LOW:      'bg-[#2ECC71] ring-emerald-100',
  INFO:     'bg-[#1B7B6F] ring-teal-100',
}

export default function DriftTimeline({ drifts, compact = false, title = 'Drift Timeline', maxItems }) {
  const navigate = useNavigate()
  const list = maxItems ? drifts.slice(0, maxItems) : compact ? drifts.slice(0, 6) : drifts

  return (
    <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAED]">
        <h3 className="text-sm font-semibold text-[#1A2332]">{title}</h3>
        <span className="text-[11px] font-medium text-[#8B95A1] bg-[#F4F6F8] px-2 py-0.5 rounded-md">{drifts.length} events</span>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <Activity className="w-8 h-8 text-[#C8D6D4] mb-2" />
          <p className="text-[13px] text-[#8B95A1]">No drift events recorded.</p>
        </div>
      ) : (
        <div className="px-5 py-4 max-h-[520px] overflow-y-auto">
          <div className="relative pl-5">
            {/* Vertical timeline rail */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E8EAED]" />

            <div className="space-y-3">
              {list.map((d) => {
                const dotCls = DOT_COLOR[d.severity] || 'bg-[#94A3B8] ring-gray-100'
                return (
                  <button
                    key={d.drift_id}
                    onClick={() => navigate(`/drifts/${d.drift_id}`)}
                    className="relative w-full text-left group"
                  >
                    {/* Timeline dot */}
                    <span className={`absolute -left-5 top-3.5 w-3 h-3 rounded-full ring-4 ${dotCls} z-10`} />

                    <div className="border border-[#E8EAED] rounded-lg p-3.5 group-hover:border-[#1B7B6F] group-hover:shadow-md transition-all duration-150 bg-white">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <SeverityBadge severity={d.severity} />
                        <span className="text-[13px] font-semibold text-[#1A2332] truncate min-w-0 flex-1">{d.control}</span>
                        <span className="text-[11px] text-[#8B95A1] shrink-0">{timeAgo(d.timestamp)}</span>
                      </div>
                      <p className={`text-[12px] text-[#64748B] leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>{d.title}</p>

                      {!compact && (
                        <div className="grid grid-cols-2 gap-2.5 mt-3">
                          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                            <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Expected</div>
                            <div className="text-[11px] font-mono text-[#1A2332] break-all">{d.expected}</div>
                          </div>
                          <div className="rounded-lg bg-red-50 border border-red-100 p-2.5">
                            <div className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1">Actual</div>
                            <div className="text-[11px] font-mono text-[#1A2332] break-all">{d.actual}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {compact && drifts.length > list.length && (
            <button
              onClick={() => navigate('/timeline')}
              className="mt-4 w-full text-center text-[12px] font-semibold text-[#1B7B6F] hover:text-[#145F56] py-2 rounded-lg hover:bg-[#EDF7F6] transition-colors duration-150"
            >
              View all {drifts.length} events →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
