import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutGrid, ShieldCheck, Activity, Share2,
  AlertOctagon, TrendingUp, Wrench, FileText,
  Settings, X, Menu
} from 'lucide-react'

const PRIMARY_NAV = [
  { to: '/', label: 'Home', icon: LayoutGrid },
  { to: '/controls', label: 'Controls', icon: ShieldCheck },
  { to: '/timeline', label: 'Timeline', icon: Activity },
  { to: '/attack-graph', label: 'Graph', icon: Share2 },
]

const MORE_NAV = [
  { to: '/incidents', label: 'Incidents', icon: AlertOctagon },
  { to: '/risk-analytics', label: 'Risk Analytics', icon: TrendingUp },
  { to: '/remediation', label: 'Remediation', icon: Wrench },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E8EAED] flex items-center justify-around py-1.5 px-2">
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#1B7B6F]' : 'text-[#94A3B8]'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-medium text-[#94A3B8]"
          aria-label="More navigation options"
        >
          <Menu className="w-5 h-5" />
          More
        </button>
      </nav>

      {/* More drawer overlay */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl border-t border-[#E8EAED] shadow-2xl pb-safe">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#E8EAED]">
              <span className="text-sm font-semibold text-[#1A2332]">More</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg hover:bg-[#F4F6F8] text-[#94A3B8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="px-3 py-3 space-y-0.5">
              {MORE_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#EDF7F6] text-[#1B7B6F] font-semibold'
                        : 'text-[#4B5563] hover:bg-[#F8F9FA]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
