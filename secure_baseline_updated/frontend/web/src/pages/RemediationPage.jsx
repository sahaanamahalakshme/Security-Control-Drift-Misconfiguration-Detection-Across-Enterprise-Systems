import { Wrench, Webhook, ChevronRight, CheckCircle2, Clock, X } from 'lucide-react'
import { useState } from 'react'
import Header from '../components/Header'
import SectionCard, { EmptyState } from '../components/SectionCard'
import { useEndpoint } from '../hooks/useEndpoint'
import api from '../api/client'
import { AUTO_HEAL_ACTIONS, WEBHOOK_STATUS } from '../data/mockData'

const STATUS_STYLES = {
  PENDING:     { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
  IN_PROGRESS: { bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200',  icon: Clock },
  COMPLETED:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  FAILED:      { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200',   icon: X },
}

export default function RemediationPage() {
  const autoHeal = useEndpoint(api.getAutoHeal,       AUTO_HEAL_ACTIONS)
  const webhooks = useEndpoint(api.getWebhookStatus,  WEBHOOK_STATUS)
  const [payloadFor, setPayloadFor] = useState(null)
  const [payload, setPayload]       = useState(null)
  const [payloadLoading, setPayloadLoading] = useState(false)

  const actions = (
    Array.isArray(autoHeal.data)
      ? autoHeal.data
      : autoHeal.data?.actions ?? autoHeal.data?.Actions ?? []
  ).map((a) => ({
    control: a.control_id ?? a.control ?? 'Unknown Control',
    action:  a.generated_payload ?? a.action ?? 'Revert to baseline state',
    status:  (a.status ?? 'PENDING').toUpperCase(),
  }))

  const wh = webhooks.data || WEBHOOK_STATUS

  async function viewPayload(control) {
    setPayloadFor(control)
    setPayload(null)
    setPayloadLoading(true)
    const res = await api.getWebhookPayload(control)
    setPayload(res.data || { note: 'No live payload available — this control has no dispatched Slack alert in demo mode.' })
    setPayloadLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header title="Remediation" subtitle="Auto-heal actions and dispatched Slack webhook alerts" />

      <div className="p-6 md:p-8 space-y-5">
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Auto-Remediation */}
          <SectionCard
            title="Pending Auto-Remediation"
            subtitle="Actions generated from BLOCKED tribunal verdicts"
            isLive={autoHeal.isLive}
            count={actions.length}
            icon={Wrench}
          >
            {actions.length === 0 ? (
              <EmptyState text="No pending auto-remediation actions." icon={Wrench} />
            ) : (
              <div className="space-y-2">
                {actions.map((a, i) => {
                  const style = STATUS_STYLES[a.status] || STATUS_STYLES.PENDING
                  const StatusIcon = style.icon
                  return (
                    <div key={i} className="flex items-start gap-3 border border-[#E8EAED] rounded-lg p-3.5 hover:shadow-sm transition-shadow">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${style.bg} ${style.border}`}>
                        <StatusIcon className={`w-4 h-4 ${style.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-[#1A2332]">{a.control}</div>
                        <div className="text-[12px] text-[#8B95A1] mt-0.5 leading-snug">{a.action}</div>
                      </div>
                      <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Webhook Dispatch Status */}
          <SectionCard
            title="Webhook Dispatch Status"
            subtitle="Slack alerts sent during the last verdict run"
            isLive={webhooks.isLive}
            count={wh.total_dispatched}
            icon={Webhook}
          >
            {(wh.alerts ?? []).length === 0 ? (
              <EmptyState text="No alerts dispatched in the last run." icon={Webhook} />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[12px] text-[#8B95A1]">
                    <span className="font-semibold text-[#1A2332]">{wh.total_dispatched}</span> alert{wh.total_dispatched !== 1 ? 's' : ''} dispatched
                  </span>
                </div>
                {wh.alerts.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => viewPayload(a.control)}
                    className={`w-full flex items-center justify-between border rounded-lg p-3.5 transition-all duration-150 text-left group ${
                      payloadFor === a.control
                        ? 'border-[#1B7B6F] bg-[#EDF7F6]'
                        : 'border-[#E8EAED] hover:border-[#1B7B6F] hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1B7B6F]/10 flex items-center justify-center">
                        <Webhook className="w-3.5 h-3.5 text-[#1B7B6F]" />
                      </div>
                      <span className="text-[13px] font-medium text-[#1A2332]">{a.control}</span>
                    </div>
                    <span className="flex items-center gap-1 text-[12px] text-[#1B7B6F] font-semibold">
                      View payload <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Payload preview */}
        {payloadFor && (
          <SectionCard
            title={`Slack Payload Preview`}
            subtitle={`Block Kit JSON for: ${payloadFor}`}
            action={
              <button
                onClick={() => { setPayloadFor(null); setPayload(null) }}
                aria-label="Close payload"
                className="p-1 rounded-lg hover:bg-[#F4F6F8] text-[#8B95A1] hover:text-[#1A2332] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            }
          >
            <pre className="text-[12px] font-mono bg-[#F8F9FA] rounded-xl border border-[#E8EAED] p-4 overflow-x-auto max-h-96 text-[#1A2332] leading-relaxed">
              {payloadLoading ? 'Loading payload…' : JSON.stringify(payload, null, 2)}
            </pre>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
