import { Gauge, Landmark, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Header from '../components/Header'
import SectionCard, { EmptyState } from '../components/SectionCard'
import { SeverityBadge } from '../components/Badges'
import { useEndpoint } from '../hooks/useEndpoint'
import api from '../api/client'
import { BUSINESS_IMPACT, CREDIT_SCORE } from '../data/mockData'

function DeltaIcon({ delta }) {
  if (delta > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
  if (delta < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
  return <Minus className="w-3.5 h-3.5 text-[#8B95A1]" />
}

export default function ReportsPage() {
  const impact = useEndpoint(api.getBusinessImpact, BUSINESS_IMPACT)
  const credit = useEndpoint(api.getCreditScore,   CREDIT_SCORE)

  // ── Credit Score ──────────────────────────────────────────────
  const csRaw = credit.data || CREDIT_SCORE
  const score = csRaw.score ?? 850
  const max   = csRaw.max   ?? 850
  const band  = csRaw.band  ?? (score >= 750 ? 'EXCELLENT' : score >= 650 ? 'GOOD' : score >= 550 ? 'FAIR' : 'POOR')
  const delta_30d = csRaw.trend ?? csRaw.delta_30d ?? 0
  const factors   = csRaw.top_negative_factors
    ? csRaw.top_negative_factors.map((f) => ({ label: f, impact: -50 }))
    : csRaw.factors ?? []
  const cs = { score, max, band, delta_30d, factors }
  const scorePct = Math.round((cs.score / cs.max) * 100)
  const scoreColor = scorePct >= 70 ? '#2ECC71' : scorePct >= 45 ? '#F39C12' : '#E74C3C'
  const bandColors = {
    EXCELLENT: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    GOOD:      'text-emerald-600 bg-emerald-50 border-emerald-200',
    FAIR:      'text-amber-600 bg-amber-50 border-amber-200',
    POOR:      'text-red-600 bg-red-50 border-red-200',
  }

  // ── Business Impact ───────────────────────────────────────────
  const biRaw      = impact.data || BUSINESS_IMPACT
  const findingsRaw = Array.isArray(biRaw) ? biRaw : (biRaw.findings ?? biRaw.Findings ?? [])
  const totalFine   = findingsRaw.reduce((sum, f) => sum + (f.estimated_fine_inr ?? 0), 0) || biRaw.estimated_fine_inr || 0
  const allFrameworks = new Set()
  findingsRaw.forEach((f) => (f.compliance_frameworks_at_risk ?? []).forEach((fw) => allFrameworks.add(fw)))
  const frameworks_at_risk = allFrameworks.size > 0 ? Array.from(allFrameworks) : biRaw.frameworks_at_risk ?? []

  const findings = findingsRaw.map((f) => {
    const revRisk = (f.revenue_risk ?? '').toUpperCase()
    const severity = revRisk.includes('SEVERE') || revRisk.includes('HIGH')
      ? 'CRITICAL'
      : revRisk.includes('MODERATE') || revRisk.includes('MEDIUM')
      ? 'HIGH' : 'MEDIUM'
    return {
      control:            f.drift_id ?? f.control ?? 'System Drift',
      severity,
      clause:             f.brand_damage ?? f.clause ?? 'Non-compliance Risk',
      framework:          (f.compliance_frameworks_at_risk ?? []).join(', ') || f.framework || 'General',
      estimated_fine_inr: f.estimated_fine_inr ?? 0,
    }
  })
  const bi = { estimated_fine_inr: totalFine, frameworks_at_risk, findings }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Reports" subtitle="Business impact estimates and executive security credit score" />

      <div className="p-6 md:p-8 space-y-5">
        <div className="grid lg:grid-cols-3 gap-5">

          {/* ── Credit Score Card ─────────────────────────────── */}
          <SectionCard title="Security Credit Score" isLive={credit.isLive} icon={Gauge} className="lg:col-span-1">
            <div className="flex flex-col items-center text-center py-2">
              {/* Donut */}
              <div className="relative w-36 h-36 mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#E8EAED" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(scorePct / 100) * 314} 314`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-mono text-[#1A2332]">{cs.score}</span>
                  <span className="text-[11px] text-[#8B95A1]">of {cs.max}</span>
                </div>
              </div>

              {/* Band badge */}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold border ${bandColors[cs.band] || bandColors.FAIR}`}>
                {cs.band}
              </span>

              {/* 30d delta */}
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-[#8B95A1]">
                <DeltaIcon delta={cs.delta_30d} />
                <span>
                  <span className={`font-semibold ${cs.delta_30d >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {cs.delta_30d >= 0 ? '+' : ''}{cs.delta_30d}
                  </span> last 30 days
                </span>
              </div>
            </div>

            {/* Score factors */}
            {factors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E8EAED] space-y-2.5">
                <div className="text-[10px] font-semibold text-[#8B95A1] uppercase tracking-wider">Score Factors</div>
                {factors.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-[#4B5563] truncate pr-2">{f.label}</span>
                    <span className={`font-mono font-bold shrink-0 ${f.impact >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {f.impact >= 0 ? '+' : ''}{f.impact}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Business Impact Card ──────────────────────────── */}
          <SectionCard
            title="Business Impact"
            subtitle={frameworks_at_risk.length ? `Frameworks at risk: ${frameworks_at_risk.join(', ')}` : 'Compliance exposure analysis'}
            isLive={impact.isLive}
            count={bi.findings.length}
            icon={Landmark}
            className="lg:col-span-2"
          >
            {/* Fine exposure banner */}
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-1">Total Estimated Fine Exposure</div>
                <div className="text-3xl font-bold font-mono text-[#E74C3C]">
                  ₹{(bi.estimated_fine_inr ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-[#8B95A1] mb-1">Frameworks at risk</div>
                <div className="flex flex-wrap justify-end gap-1">
                  {(bi.frameworks_at_risk ?? []).map((fw) => (
                    <span key={fw} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">{fw}</span>
                  ))}
                </div>
              </div>
            </div>

            {bi.findings.length === 0 ? (
              <EmptyState text="No compliance findings recorded." icon={Landmark} />
            ) : (
              <div className="space-y-2">
                {bi.findings.map((f, i) => (
                  <div key={i} className="flex items-center justify-between border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="text-[13px] font-medium text-[#1A2332] truncate">{f.control}</div>
                      <div className="text-[11px] text-[#8B95A1] mt-0.5">{f.framework} · {f.clause}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <SeverityBadge severity={f.severity} />
                      <div className="text-right">
                        <div className="text-[13px] font-mono font-bold text-[#1A2332]">₹{f.estimated_fine_inr.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-[#8B95A1]">estimated</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
