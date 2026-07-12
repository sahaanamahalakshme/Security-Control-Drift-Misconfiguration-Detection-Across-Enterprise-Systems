// Thin client over the Secure Baseline FastAPI backend (backend/api/main.py).
// Base URL is read from VITE_API_BASE_URL (see .env.example). Every method
// resolves to { data, source: 'live'|'error', error } and never throws,
// so callers can safely fall back to demo data.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', timeoutMs = 6000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || `HTTP ${res.status}`)
    }
    return { data: await res.json(), source: 'live', error: null }
  } catch (err) {
    clearTimeout(timer)
    return { data: null, source: 'error', error: err.name === 'AbortError' ? 'Request timed out' : err.message }
  }
}

const api = {
  baseUrl: BASE_URL,
  health: () => request('/health'),
  runPipeline: () => request('/pipeline/run', { method: 'POST' }),
  runIntelligence: () => request('/intelligence/run', { method: 'POST' }),

  getControls: () => request('/controls'),
  getControlById: (id) => request(`/controls/${id}`),

  getDrifts: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/drifts${qs ? `?${qs}` : ''}`)
  },
  getDriftById: (id) => request(`/drifts/${id}`),

  getTrust: () => request('/intelligence/trust'),
  getTTL: () => request('/intelligence/ttl'),
  getAttackGraph: () => request('/intelligence/attack-graph'),
  getForensics: () => request('/intelligence/forensics'),
  getTribunal: () => request('/intelligence/tribunal'),
  getCounterfactual: () => request('/intelligence/counterfactual'),
  getDriftDNA: () => request('/intelligence/drift-dna'),
  getImmuneMemory: () => request('/intelligence/immune-memory'),
  getForecasting: () => request('/intelligence/forecasting'),
  getBusinessImpact: () => request('/intelligence/business-impact'),
  getCreditScore: () => request('/intelligence/credit-score'),
  getTimeMachine: () => request('/intelligence/time-machine'),
  getStorytelling: () => request('/intelligence/storytelling'),

  getAutoHeal: () => request('/remediation/auto-heal'),
  getWebhookStatus: () => request('/remediation/webhook-status'),
  getWebhookPayload: (controlId) => request(`/remediation/webhook-payload/${controlId}`),
}

export default api
