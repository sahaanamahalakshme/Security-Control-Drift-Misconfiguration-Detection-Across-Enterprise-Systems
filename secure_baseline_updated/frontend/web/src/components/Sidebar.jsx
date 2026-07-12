import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, ShieldCheck, Activity, Share2,
  AlertOctagon, TrendingUp, Wrench, FileText,
  Settings, ShieldHalf
} from 'lucide-react'
import { useApp } from '../context/AppContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/controls', label: 'Control Health', icon: ShieldCheck },
  { to: '/timeline', label: 'Drift Timeline', icon: Activity },
  { to: '/attack-graph', label: 'Attack Graph', icon: Share2 },
  { to: '/incidents', label: 'Incidents', icon: AlertOctagon },
  { to: '/risk-analytics', label: 'Risk Analytics', icon: TrendingUp },
  { to: '/remediation', label: 'Remediation', icon: Wrench },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { liveBackend, summary } = useApp()

  return (
    <aside className="hidden md:flex md:w-60 shrink-0 bg-white border-r border-[#E8EAED] flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-[#E8EAED] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#1B7B6F] flex items-center justify-center shrink-0 shadow-sm">
          <ShieldHalf className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-[#1A2332] text-sm leading-tight tracking-tight">SentinelDNA</div>
          <div className="text-[10px] text-[#8B95A1] mt-0.5 leading-none">Security Drift Intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#EDF7F6] text-[#1B7B6F] font-semibold'
                  : 'text-[#64748B] hover:bg-[#F8F9FA] hover:text-[#1A2332]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#1B7B6F]' : 'text-[#94A3B8]'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#E8EAED] px-3 py-3 space-y-2">
        {/* Live status */}
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${
          liveBackend ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${liveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {liveBackend ? 'Live backend connected' : 'Demo mode active'}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors cursor-default">
          <div className="w-7 h-7 rounded-full bg-[#1B7B6F] text-white flex items-center justify-center font-semibold text-[11px] shrink-0">
            ST
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-[#1A2332] truncate leading-tight">Security Team</div>
            <div className="text-[10px] text-[#8B95A1] truncate leading-tight">Admin · {summary.avg_health}% health</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
