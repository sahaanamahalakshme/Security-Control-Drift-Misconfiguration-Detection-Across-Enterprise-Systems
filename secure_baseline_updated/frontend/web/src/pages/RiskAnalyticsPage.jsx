import { TrendingUp, TrendingDown, Minus, Dna, Syringe, Clock3, Microscope, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SectionCard, { EmptyState } from '../components/SectionCard'
import { ProgressPill, StatusBadge } from '../components/Badges'
import { useEndpoint } from '../hooks/useEndpoint'
import api from '../api/client'
import { FORECASTING, COUNTERFACTUALS, DRIFT_DNA, IMMUNE_MEMORY, TTL_FINDINGS, FORENSICS, TRUST } from '../data/mockData'

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }

export default function RiskAnalyticsPage() {
  const navigate = useNavigate()
  const forecasting   = useEndpoint(api.getForecasting,    FORECASTING)
  const counterfactual = useEndpoint(api.getCounterfactual, COUNTERFACTUALS)
  const driftDna      = useEndpoint(api.getDriftDNA,       DRIFT_DNA)
  const immune        = useEndpoint(api.getImmuneMemory,   IMMUNE_MEMORY)
  const ttl           = useEndpoint(api.getTTL,            TTL_FINDINGS)
  const forensics     = useEndpoint(api.getForensics,      FORENSICS)
  const trust         = useEndpoint(api.getTrust,          TRUST)

  const forecast = (Array.isArray(forecasting.data) ? forecasting.data : forecasting.data?.forecasts ?? []).map((f) => ({
    domain:          f.domain,
    likelihood_pct:  typeof f.probability === 'number' ? Math.round(f.probability <= 1 ? f.probability * 100 : f.probability) : f.likelihood_pct ?? 0,
    trend:           f.velocity_trend ?? f.trend ?? 'flat',
  }))

  const cf = (Array.isArray(counterfactual.data) ? counterfactual.data : counterfactual.data?.results ?? []).map((c) => {
    const withDrift    = Array.isArray(c.blast_radius_with_drift)    ? c.blast_radius_with_drift.length    : c.blast_radius_with_drift    ?? 0
    const withoutDrift = Array.isArray(c.blast_radius_without_drift) ? c.blast_radius_without_drift.length : c.blast_radius_without_drift ?? 0
    return {
      control_id:          c.drift_control ?? c.control_id,
      control:             c.drift_control ?? c.control ?? c.resource_id,
      blast_radius_now:    withDrift,
      blast_radius_if_fixed: withoutDrift,
      risk_reduction_pct:  typeof c.risk_reduction === 'number'
        ? Math.round(c.risk_reduction <= 1 ? c.risk_reduction * 100 : c.risk_reduction)
        : c.risk_reduction_pct ?? 0,
    }
  })

  const dna = (Array.isArray(driftDna.data) ? driftDna.data : driftDna.data?.lineages ?? []).map((d) => {
    const rawMutations    = d.mutations ?? d.lineage ?? []
    const lastMutationObj = rawMutations.slice(-1)[0]
    let mutationStr = 'No mutations observed'
    if (lastMutationObj) {
      if (typeof lastMutationObj === 'string') {
        mutationStr = lastMutationObj
      } else if (typeof lastMutationObj === 'object') {
        const action  = lastMutationObj.action ?? 'Mutation'
        const field   = lastMutationObj.field  ?? 'configuration'
        const oldVal  = lastMutationObj.old    !== undefined ? lastMutationObj.old : '?'
        const newVal  = lastMutationObj.new    !== undefined ? lastMutationObj.new : '?'
        mutationStr   = `${action}: changed ${field} from ${oldVal} to ${newVal}`
      }
    } else if (d.mutation) {
      mutationStr = d.mutation
    }
    return { drift_id: d.control_id ?? d.drift_id, lineage: rawMutations, generation: rawMutations.length, mutation: mutationStr }
  })

  const antibodies = (Array.isArray(immune.data) ? immune.data : immune.data?.signatures ?? []).map((i) => ({
    signature_id:   i.signature_id,
    pattern:        `${i.mitre_technique ?? 'T1000'} in ${i.control_domain ?? 'General'}`,
    source_verdicts: [i.action_type ?? 'VERDICT'],
    strength:       i.confidence_weight >= 0.8 ? 'STRONG' : i.confidence_weight >= 0.5 ? 'MEDIUM' : 'WEAK',
    strengthStyle:  i.confidence_weight >= 0.8 ? 'text-red-600 bg-red-50 border-red-200' : i.confidence_weight >= 0.5 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-[#8B95A1] bg-[#F4F6F8] border-[#E8EAED]',
  }))

  const ttlFindings = (Array.isArray(ttl.data) ? ttl.data : ttl.data?.findings ?? []).map((t) => ({
    id:          t.maintenance_id ?? t.id,
    control_id:  t.control_id,
    control:     t.control_id,
    window:      t.maintenance_id ?? 'Exception window',
    expires_at:  t.expiry_time ?? t.expires_at,
    status:      t.status ?? 'ACTIVE',
    approved_by: t.unapproved ? 'UNAPPROVED' : 'System',
  }))

  const anomalies = (Array.isArray(forensics.data) ? forensics.data : forensics.data?.anomalies ?? []).map((f) => ({
    event_id:              f.event_id ?? f.anomaly_id,
    control:               f.control_id ?? f.control ?? 'Control',
    isolation_forest_score: f.isolation_score ?? f.isolation_forest_score ?? 0,
    change_point:          (f.changepoint_score ?? 0) > 0.5,
    anomaly_band:          (f.isolation_score ?? 0) >= 0.8 ? 'HIGH' : (f.isolation_score ?? 0) >= 0.5 ? 'MEDIUM' : 'LOW',
  }))

  const trustList = Array.isArray(trust.data)
    ? trust.data.map((t) => ({
        actor: t.actor,
        trust_score: Math.round(t.trust_score ?? t.score ?? 0),
        risk_band: t.trust_band === 'HIGH_TRUST' ? 'LOW' : t.trust_band === 'MODERATE_TRUST' ? 'MEDIUM' : t.trust_band === 'LOW_TRUST' ? 'HIGH' : t.risk_band ?? 'HIGH',
      }))
    : Object.entries(trust.data ?? {}).map(([actor, data]) => {
        const ts = typeof data === 'number' ? data : data?.trust_score ?? 0
        const band = typeof data === 'object' ? data?.trust_band : null
        return {
          actor,
          trust_score: Math.round(ts),
          risk_band: band === 'HIGH_TRUST' ? 'LOW' : band === 'MODERATE_TRUST' ? 'MEDIUM' : band === 'LOW_TRUST' ? 'HIGH' : ts >= 80 ? 'LOW' : ts >= 60 ? 'MEDIUM' : 'HIGH',
        }
      })

  const anomalyBandStyle = { HIGH: 'text-red-600', MEDIUM: 'text-amber-600', LOW: 'text-emerald-600' }
  const ttlStatusMap = {
    EXPIRED:      'bg-red-50 text-red-700 border-red-200',
    EXPIRES_SOON: 'bg-amber-50 text-amber-700 border-amber-200',
    ACTIVE:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Risk Analytics" subtitle="Forecasting, blast-radius modeling, drift lineage, and behavioral trust" />

      <div className="p-6 md:p-8 space-y-5">

        {/* Row 1: Forecasting + Counterfactual */}
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard
            title="Drift Forecasting"
            subtitle="Predictive drift likelihood by domain (next 7 days)"
            isLive={forecasting.isLive}
            count={forecast.length}
            icon={TrendingUp}
          >
            {forecast.length === 0 ? (
              <EmptyState text="No forecasting data available." icon={TrendingUp} />
            ) : (
              <div className="space-y-3.5">
                {forecast.map((f, i) => {
                  const Trend = TREND_ICON[f.trend] || Minus
                  const tone  = f.likelihood_pct >= 60 ? 'crit' : f.likelihood_pct >= 35 ? 'warn' : 'healthy'
                  const likelihoodColor = f.likelihood_pct >= 60 ? 'text-red-600' : f.likelihood_pct >= 35 ? 'text-amber-600' : 'text-emerald-600'
                  return (
                    <div key={f.domain ?? i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-medium text-[#1A2332]">{f.domain}</span>
                        <span className={`flex items-center gap-1 text-[12px] font-mono font-semibold ${likelihoodColor}`}>
                          {f.likelihood_pct}% <Trend className="w-3 h-3" />
                        </span>
                      </div>
                      <ProgressPill pct={f.likelihood_pct} tone={tone} />
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Counterfactual Analysis"
            subtitle="Blast-radius risk reduction if each control were remediated"
            isLive={counterfactual.isLive}
            count={cf.length}
          >
            {cf.length === 0 ? (
              <EmptyState text="No counterfactual data available." />
            ) : (
              <div className="space-y-2">
                {cf.map((c, i) => (
                  <div key={`${c.control_id ?? 'cf'}-${i}`} className="border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-semibold text-[#1A2332] truncate pr-2">{c.control}</span>
                      <span className="text-[12px] font-bold text-emerald-600 shrink-0">−{c.risk_reduction_pct}% risk</span>
                    </div>
                    <div className="text-[12px] text-[#8B95A1]">
                      Blast radius <span className="font-mono font-semibold text-[#1A2332]">{c.blast_radius_now}</span> → <span className="font-mono font-semibold text-emerald-600">{c.blast_radius_if_fixed}</span> hops if remediated
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Row 2: DNA + Immune Memory + TTL */}
        <div className="grid lg:grid-cols-3 gap-5">
          <SectionCard title="Drift DNA" subtitle="Lineage of repeated mutations" isLive={driftDna.isLive} count={dna.length} icon={Dna}>
            {dna.length === 0 ? (
              <EmptyState text="No lineage data available." icon={Dna} />
            ) : (
              <div className="space-y-2">
                {dna.map((d, i) => (
                  <button
                    key={d.drift_id ?? i}
                    onClick={() => navigate(`/drifts/${d.drift_id}`)}
                    className="w-full text-left border border-[#E8EAED] rounded-lg p-3.5 hover:border-[#1B7B6F] hover:shadow-md transition-all duration-150 group"
                  >
                    <div className="text-[11px] font-mono text-[#8B95A1] mb-1">{d.drift_id}</div>
                    <div className="text-[13px] text-[#1A2332] mb-1.5 leading-snug">{d.mutation}</div>
                    <div className="text-[11px] text-[#8B95A1]">
                      Generation {d.generation} · {(d.lineage ?? []).length} steps
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Immune Memory" subtitle="Antibody signatures from past BLOCK verdicts" isLive={immune.isLive} count={antibodies.length} icon={Syringe}>
            {antibodies.length === 0 ? (
              <EmptyState text="No antibody signatures recorded." icon={Syringe} />
            ) : (
              <div className="space-y-2">
                {antibodies.map((a, i) => (
                  <div key={a.signature_id ?? i} className="border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-[#8B95A1] truncate pr-2">{a.signature_id}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${a.strengthStyle}`}>
                        {a.strength}
                      </span>
                    </div>
                    <div className="text-[13px] text-[#1A2332]">{a.pattern}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="TTL / Maintenance Windows" subtitle="Expired or unapproved change windows" isLive={ttl.isLive} count={ttlFindings.length} icon={Clock3}>
            {ttlFindings.length === 0 ? (
              <EmptyState text="No maintenance window violations." icon={Clock3} />
            ) : (
              <div className="space-y-2">
                {ttlFindings.map((t, i) => (
                  <div key={t.id ?? i} className="border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#1A2332] truncate pr-2">{t.control}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 ${ttlStatusMap[t.status] || ttlStatusMap.ACTIVE}`}>
                        {t.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8B95A1]">{t.window} · approved by {t.approved_by}</div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Row 3: Deep Forensics + Actor Trust */}
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Deep Forensics" subtitle="Isolation Forest & change-point anomaly scores" isLive={forensics.isLive} count={anomalies.length} icon={Microscope}>
            {anomalies.length === 0 ? (
              <EmptyState text="No forensic anomalies scored." icon={Microscope} />
            ) : (
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <button
                    key={a.event_id ?? i}
                    onClick={() => navigate(`/drifts/${a.event_id}`)}
                    className="w-full text-left flex items-center justify-between border border-[#E8EAED] rounded-lg p-3.5 hover:border-[#1B7B6F] hover:shadow-md transition-all duration-150"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-[13px] font-medium text-[#1A2332] truncate">{a.control}</div>
                      <div className="text-[11px] text-[#8B95A1] mt-0.5">
                        {a.change_point ? '⚑ Change-point detected' : 'No change-point'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-mono font-bold text-[#1A2332]">{a.isolation_forest_score?.toFixed(2)}</div>
                      <div className={`text-[10px] font-bold uppercase ${anomalyBandStyle[a.anomaly_band] || 'text-[#8B95A1]'}`}>
                        {a.anomaly_band}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Actor Trust Scores" subtitle="Behavioral trust based on historical activity" isLive={trust.isLive} count={trustList.length} icon={Users}>
            {trustList.length === 0 ? (
              <EmptyState text="No actor trust data available." icon={Users} />
            ) : (
              <div className="space-y-3.5">
                {trustList.map((t, i) => (
                  <div key={t.actor ?? i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-mono text-[#1A2332] truncate pr-3">{t.actor}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[12px] font-mono font-bold text-[#1A2332]">{t.trust_score}</span>
                        <StatusBadge status={t.risk_band === 'LOW' ? 'healthy' : t.risk_band === 'MEDIUM' ? 'drifting' : 'critical'} />
                      </div>
                    </div>
                    <ProgressPill pct={t.trust_score} tone={t.trust_score >= 70 ? 'healthy' : t.trust_score >= 40 ? 'warn' : 'crit'} />
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
