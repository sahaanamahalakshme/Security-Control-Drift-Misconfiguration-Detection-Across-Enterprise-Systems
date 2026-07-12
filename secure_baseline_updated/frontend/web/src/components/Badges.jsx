const SEVERITY_STYLES = {
  CRITICAL: 'bg-red-500 text-white',
  HIGH:     'bg-red-50 text-red-600 border border-red-200',
  MEDIUM:   'bg-amber-50 text-amber-600 border border-amber-200',
  LOW:      'bg-emerald-50 text-emerald-600 border border-emerald-200',
  INFO:     'bg-teal-50 text-[#1B7B6F] border border-teal-200',
}

export function SeverityBadge({ severity }) {
  const cls = SEVERITY_STYLES[severity] || SEVERITY_STYLES.MEDIUM
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${cls}`}>
      {severity}
    </span>
  )
}

const STATUS_STYLES = {
  healthy:  { dot: 'bg-[#2ECC71]', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Healthy' },
  drifting: { dot: 'bg-[#F39C12]', text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Needs Attention' },
  critical: { dot: 'bg-[#E74C3C]', text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Unhealthy' },
}

export function StatusDot({ status, className = '' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.healthy
  return <span className={`inline-block w-2 h-2 rounded-full ${s.dot} ${className}`} />
}

export function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.healthy
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${pad} ${s.bg} ${s.text} ${s.border}`}>
      <StatusDot status={status} />
      {s.label}
    </span>
  )
}

export function HealthBar({ value }) {
  const color = value >= 80 ? 'bg-[#2ECC71]' : value >= 50 ? 'bg-[#F39C12]' : 'bg-[#E74C3C]'
  return (
    <div className="w-full h-1.5 rounded-full bg-[#E8EAED] overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  )
}

export function timeAgo(ts) {
  if (!ts) return '—'
  const diff = Date.now() - new Date(ts).getTime()
  if (Number.isNaN(diff)) return '—'
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

const VERDICT_STYLES = {
  ALLOW:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ESCALATE: 'bg-amber-50 text-amber-700 border border-amber-200',
  BLOCK:    'bg-red-500 text-white',
}

export function VerdictBadge({ verdict }) {
  const cls = VERDICT_STYLES[verdict] || VERDICT_STYLES.ESCALATE
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase shrink-0 ${cls}`}>
      {verdict}
    </span>
  )
}

export function LiveTag({ isLive }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
      isLive
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {isLive ? 'Live' : 'Demo'}
    </span>
  )
}

export function ProgressPill({ pct, tone = 'accent' }) {
  const colors = {
    accent:  'bg-[#1B7B6F]',
    healthy: 'bg-[#2ECC71]',
    warn:    'bg-[#F39C12]',
    crit:    'bg-[#E74C3C]',
  }
  return (
    <div className="w-full h-1.5 rounded-full bg-[#E8EAED] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[tone] || colors.accent}`}
        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
      />
    </div>
  )
}
