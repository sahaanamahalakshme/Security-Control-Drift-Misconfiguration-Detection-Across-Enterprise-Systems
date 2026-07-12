import { ShieldCheck, CheckCircle2, Activity, AlertTriangle, HeartPulse } from 'lucide-react'

function pct(n, total) {
  if (!total) return 0
  return Math.round((n / total) * 100)
}

function healthColor(v) {
  if (v >= 80) return { text: 'text-[#2ECC71]', bg: 'bg-emerald-50', border: 'border-t-emerald-400' }
  if (v >= 50) return { text: 'text-[#F39C12]', bg: 'bg-amber-50', border: 'border-t-amber-400' }
  return { text: 'text-[#E74C3C]', bg: 'bg-red-50', border: 'border-t-red-400' }
}

export default function SummaryCards({ summary }) {
  const hc = healthColor(summary.avg_health)

  const cards = [
    {
      label: 'Total Controls',
      value: summary.total_controls,
      icon: ShieldCheck,
      accent: 'border-t-[#1B7B6F]',
      iconClass: 'text-[#1B7B6F] bg-teal-50',
      valueClass: 'text-[#1A2332]',
    },
    {
      label: 'Healthy',
      value: summary.healthy,
      sub: `${pct(summary.healthy, summary.total_controls)}% of total`,
      icon: CheckCircle2,
      accent: 'border-t-emerald-400',
      iconClass: 'text-[#2ECC71] bg-emerald-50',
      valueClass: 'text-[#2ECC71]',
    },
    {
      label: 'Drifting',
      value: summary.drifting,
      sub: `${pct(summary.drifting, summary.total_controls)}% of total`,
      icon: Activity,
      accent: 'border-t-amber-400',
      iconClass: 'text-[#F39C12] bg-amber-50',
      valueClass: 'text-[#F39C12]',
    },
    {
      label: 'Critical',
      value: summary.critical,
      sub: `${pct(summary.critical, summary.total_controls)}% of total`,
      icon: AlertTriangle,
      accent: summary.critical > 0 ? 'border-t-red-500' : 'border-t-[#ECF0F1]',
      iconClass: summary.critical > 0 ? 'text-[#E74C3C] bg-red-50' : 'text-[#94A3B8] bg-[#F8F9FA]',
      valueClass: summary.critical > 0 ? 'text-[#E74C3C]' : 'text-[#1A2332]',
      highlight: summary.critical > 0,
    },
    {
      label: 'Avg Health',
      value: `${summary.avg_health}%`,
      sub: summary.avg_health >= 80 ? 'Good posture' : summary.avg_health >= 50 ? 'Needs attention' : 'At risk',
      icon: HeartPulse,
      accent: hc.border,
      iconClass: `${hc.text} ${hc.bg}`,
      valueClass: hc.text,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, idx) => (
        <div
          key={c.label}
          className={`relative bg-white rounded-xl border border-[#E8EAED] border-t-2 ${c.accent} shadow-sm hover:shadow-md transition-shadow duration-200 p-4 ${
            c.highlight ? 'ring-1 ring-red-200' : ''
          } ${idx === cards.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#8B95A1] uppercase tracking-wider">{c.label}</span>
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconClass}`}>
              <c.icon className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono ${c.valueClass} leading-none`}>{c.value}</div>
          {c.sub && <div className="mt-1.5 text-[11px] text-[#8B95A1] leading-none">{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}
