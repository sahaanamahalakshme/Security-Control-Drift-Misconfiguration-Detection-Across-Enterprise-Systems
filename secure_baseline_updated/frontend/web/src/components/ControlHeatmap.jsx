import { useMemo, useState } from 'react'
import { ChevronDown, Cloud, ShieldCheck, Flame, KeyRound, Laptop2 } from 'lucide-react'
import { HealthBar, StatusDot, StatusBadge, timeAgo } from './Badges'

const SYS_ICON = { AWS: Cloud, Azure: Cloud, Firewall: Flame, IAM: KeyRound, Endpoint: Laptop2 }

export default function ControlHeatmap({ systems, compact = false, title = 'Control Health Heatmap' }) {
  const [openSystem, setOpenSystem] = useState(null)
  const [selected, setSelected] = useState(null)

  const flatCount = useMemo(() => systems.reduce((s, g) => s + g.controls.length, 0), [systems])

  return (
    <div className={`bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden ${compact ? 'xl:col-span-1' : ''}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAED]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1A2332]">{title}</h3>
        </div>
        <span className="text-[11px] font-medium text-[#8B95A1] bg-[#F4F6F8] px-2 py-0.5 rounded-md">{flatCount} controls</span>
      </div>

      <div className={compact ? '' : 'grid lg:grid-cols-[1fr_360px]'}>
        <div className="divide-y divide-[#F4F6F8] max-h-[520px] overflow-y-auto">
          {systems.map((group, idx) => {
            const isOpen = openSystem === null ? idx === 0 : openSystem === group.name
            const avg = Math.round(group.controls.reduce((s, c) => s + c.health, 0) / group.controls.length)
            const Icon = SYS_ICON[group.name] || ShieldCheck
            const avgColor = avg >= 80 ? 'text-emerald-600 bg-emerald-50' : avg >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'

            return (
              <div key={group.name}>
                <button
                  onClick={() => setOpenSystem(isOpen ? '__none__' : group.name)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F8F9FA] transition-colors duration-100"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-[#1B7B6F]" />
                    <span className="text-[13px] font-semibold text-[#1A2332]">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] text-[#8B95A1] hidden sm:inline">{group.controls.length} controls</span>
                    <span className={`text-[11px] font-bold rounded-md px-2 py-0.5 ${avgColor}`}>{avg}%</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className={`grid gap-2.5 px-5 pb-4 pt-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {group.controls.map((c) => (
                      <button
                        key={c.control_id}
                        onClick={() => setSelected(c)}
                        className={`text-left rounded-lg border px-4 py-3 transition-all duration-150 hover:shadow-md ${
                          selected?.control_id === c.control_id
                            ? 'border-[#1B7B6F] ring-1 ring-[#1B7B6F]/20 bg-[#EDF7F6]'
                            : 'border-[#E8EAED] bg-white hover:border-[#C8D6D4]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-medium text-[#1A2332] truncate pr-2 leading-tight">{c.name}</span>
                          <span className={`font-mono text-[13px] font-bold shrink-0 ${
                            c.health >= 80 ? 'text-[#2ECC71]' : c.health >= 50 ? 'text-[#F39C12]' : 'text-[#E74C3C]'
                          }`}>
                            {c.health}%
                          </span>
                        </div>
                        <HealthBar value={c.health} />
                        <div className="flex items-center gap-1.5 mt-2">
                          <StatusDot status={c.status} />
                          <span className="text-[11px] text-[#8B95A1] capitalize">{c.status}</span>
                          {c.drift_count > 0 && (
                            <span className="text-[11px] text-[#8B95A1] ml-auto">
                              {c.drift_count} drift{c.drift_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {!compact && (
          <div className="border-t lg:border-t-0 lg:border-l border-[#E8EAED]">
            {selected ? (
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A2332] leading-tight">{selected.name}</h4>
                    <span className="text-[11px] text-[#8B95A1] mt-0.5 inline-block">{selected.system} · {selected.category}</span>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold font-mono text-[#1A2332]">{selected.health}%</span>
                  <span className="text-[11px] text-[#8B95A1] pb-1">Health Score</span>
                </div>
                <HealthBar value={selected.health} />
                {selected.description && (
                  <p className="text-[13px] text-[#4B5563] mt-4 leading-relaxed">{selected.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-[#F8F9FA] rounded-lg px-3 py-2.5">
                    <div className="text-[10px] text-[#8B95A1] uppercase tracking-wide mb-1">Drift Count</div>
                    <div className="text-sm font-semibold text-[#1A2332]">{selected.drift_count}</div>
                  </div>
                  <div className="bg-[#F8F9FA] rounded-lg px-3 py-2.5">
                    <div className="text-[10px] text-[#8B95A1] uppercase tracking-wide mb-1">Last Checked</div>
                    <div className="text-sm font-semibold text-[#1A2332]">{timeAgo(selected.last_checked)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center px-6 py-10">
                <div>
                  <ShieldCheck className="w-8 h-8 text-[#C8D6D4] mx-auto mb-2" />
                  <p className="text-[13px] text-[#8B95A1]">Select a control to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
