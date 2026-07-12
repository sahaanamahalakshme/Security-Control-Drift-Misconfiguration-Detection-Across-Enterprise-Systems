import { RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'

const SCENARIOS = ['normal', 'crisis', 'optimal']

export default function Header({ title, subtitle, showScenarioSwitcher = false }) {
  const { liveBackend, loading, refresh, scenario, setScenario } = useApp()

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E8EAED]">
      <div className="flex items-center gap-4 px-6 md:px-8 h-[60px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold text-[#1A2332] leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-[#8B95A1] truncate hidden sm:block mt-0.5 leading-none">{subtitle}</p>
          )}
        </div>

        {showScenarioSwitcher && !liveBackend && (
          <div className="hidden sm:flex items-center bg-[#F4F6F8] rounded-lg p-0.5 gap-0.5 border border-[#E8EAED]">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold capitalize transition-all duration-150 ${
                  scenario === s
                    ? 'bg-white text-[#1B7B6F] shadow-sm border border-[#E8EAED]'
                    : 'text-[#8B95A1] hover:text-[#1A2332]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={refresh}
          aria-label="Refresh data"
          className="p-2 rounded-lg hover:bg-[#F4F6F8] text-[#94A3B8] hover:text-[#1A2332] transition-all duration-150 shrink-0 border border-transparent hover:border-[#E8EAED]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  )
}
