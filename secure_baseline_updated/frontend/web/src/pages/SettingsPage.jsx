import { useState } from 'react'
import {
  Play, Cpu, CheckCircle2, AlertTriangle,
  Globe, RefreshCw, Database, Activity,
  Wifi, WifiOff
} from 'lucide-react'
import Header from '../components/Header'
import { useApp } from '../context/AppContext'
import api from '../api/client'

export default function SettingsPage() {
  const { liveBackend, apiBaseUrl, refresh } = useApp()

  const [pipelineLoading, setPipelineLoading] = useState(false)
  const [pipelineResult,  setPipelineResult]  = useState(null)
  const [pipelineError,   setPipelineError]   = useState(null)

  const [intelLoading, setIntelLoading] = useState(false)
  const [intelResult,  setIntelResult]  = useState(null)
  const [intelError,   setIntelError]   = useState(null)

  async function handleRunPipeline() {
    setPipelineLoading(true)
    setPipelineResult(null)
    setPipelineError(null)
    try {
      const res = await api.runPipeline()
      if (res.source === 'live') {
        setPipelineResult(res.data)
        await refresh()
      } else {
        setPipelineError(res.error || 'Failed to run detection pipeline')
      }
    } catch (err) {
      setPipelineError(err.message)
    } finally {
      setPipelineLoading(false)
    }
  }

  async function handleRunIntelligence() {
    setIntelLoading(true)
    setIntelResult(null)
    setIntelError(null)
    try {
      const res = await api.runIntelligence()
      if (res.source === 'live') {
        setIntelResult(res.data)
        await refresh()
      } else {
        setIntelError(res.error || 'Failed to run intelligence engine')
      }
    } catch (err) {
      setIntelError(err.message)
    } finally {
      setIntelLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header
        title="Operations & Settings"
        subtitle="Trigger ingestion pipelines, run intelligence engines, and configure integrations"
      />

      <div className="p-6 md:p-8 space-y-5 max-w-5xl">

        {/* ── Backend Status ───────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E8EAED]">
            <Globe className="w-4 h-4 text-[#1B7B6F]" />
            <h3 className="text-sm font-semibold text-[#1A2332]">Backend Connection Status</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] px-5 py-4">
              <div>
                <div className="text-[10px] font-semibold text-[#8B95A1] uppercase tracking-wider mb-1">API Base URL</div>
                <div className="text-[13px] font-mono font-semibold text-[#1A2332]">{apiBaseUrl}</div>
              </div>
              <div className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 border text-[13px] font-semibold ${
                liveBackend
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {liveBackend
                  ? <><Wifi className="w-4 h-4" /> Connected · Live Backend</>
                  : <><WifiOff className="w-4 h-4" /> Offline · Demo Data</>
                }
              </div>
            </div>

            {!liveBackend && (
              <div className="mt-3 flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Backend unreachable.</span> The FastAPI server is not running or has no generated data.
                  Start it with: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">uvicorn api.main:app --reload</code> in the <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">backend/</code> directory.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Cards ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Detection Engine */}
          <EngineCard
            icon={Database}
            title="Detection Engine Ingestion"
            description="Re-scans AWS and Azure configurations, compares resources against secure baselines, and regenerates the drift list."
            loading={pipelineLoading}
            disabled={!liveBackend}
            result={pipelineResult && (
              <ResultBox success label="Ingestion completed successfully!">
                {pipelineResult.detection_summary && (
                  <pre className="font-mono bg-white p-2.5 rounded-lg border border-emerald-100 max-h-48 overflow-y-auto text-[11px] leading-relaxed">
                    {JSON.stringify(pipelineResult.detection_summary, null, 2)}
                  </pre>
                )}
              </ResultBox>
            )}
            error={pipelineError && <ErrorBox message={pipelineError} />}
            onRun={handleRunPipeline}
            buttonLabel="Trigger Ingestion Pipeline"
            loadingLabel="Ingesting & scanning..."
            buttonIcon={Play}
          />

          {/* Intelligence Engine */}
          <EngineCard
            icon={Cpu}
            title="Intelligence & Forensic Suite"
            description="Re-evaluates behavioral trust scores, performs Isolation Forest anomaly checks, and runs the AI Tribunal to formulate new verdicts."
            loading={intelLoading}
            disabled={!liveBackend}
            result={intelResult && (
              <ResultBox success label="Analysis completed successfully!">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Verdicts',       value: intelResult.verdicts ? Object.keys(intelResult.verdicts).length : 0 },
                    { label: 'Anomalies',      value: intelResult.forensic_anomalies_count ?? 0 },
                    { label: 'Counterfactuals', value: intelResult.counterfactuals_count ?? 0 },
                    { label: 'TTL Violations', value: intelResult.ttl_violations_count ?? 0 },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-lg border border-emerald-100 px-3 py-2">
                      <div className="text-[10px] text-[#8B95A1] uppercase tracking-wide">{label}</div>
                      <div className="text-base font-bold font-mono text-[#1A2332]">{value}</div>
                    </div>
                  ))}
                </div>
              </ResultBox>
            )}
            error={intelError && <ErrorBox message={intelError} />}
            onRun={handleRunIntelligence}
            buttonLabel="Run Intelligence Engine"
            loadingLabel="Analyzing threats..."
            buttonIcon={Activity}
          />
        </div>

      </div>
    </div>
  )
}

function EngineCard({ icon: Icon, title, description, loading, disabled, result, error, onRun, buttonLabel, loadingLabel, buttonIcon: BtnIcon }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#E8EAED]">
        <Icon className="w-4 h-4 text-[#1B7B6F]" />
        <h3 className="text-sm font-semibold text-[#1A2332]">{title}</h3>
      </div>
      <div className="p-5 flex flex-col flex-1 gap-4">
        <p className="text-[13px] text-[#8B95A1] leading-relaxed">{description}</p>
        {result}
        {error}
        <div className="mt-auto">
          <button
            onClick={onRun}
            disabled={loading || disabled}
            className={`w-full py-2.5 px-4 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
              loading
                ? 'bg-[#F4F6F8] text-[#8B95A1] cursor-not-allowed border border-[#E8EAED]'
                : disabled
                ? 'bg-[#F4F6F8] text-[#8B95A1] cursor-not-allowed border border-[#E8EAED]'
                : 'bg-[#1B7B6F] hover:bg-[#145F56] text-white shadow-sm hover:shadow-md'
            }`}
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />{loadingLabel}</>
            ) : (
              <><BtnIcon className="w-4 h-4" />{disabled ? `${buttonLabel} (backend offline)` : buttonLabel}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultBox({ label, children }) {
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-2.5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" /> {label}
      </div>
      {children}
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-2.5 text-[13px] text-red-700">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <div><span className="font-bold">Error:</span> {message}</div>
    </div>
  )
}
