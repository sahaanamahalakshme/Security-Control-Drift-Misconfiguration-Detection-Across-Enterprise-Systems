import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import { SCENARIOS, TRUST } from '../data/mockData'

const AppContext = createContext(null)

// ---- Normalizers -----------------------------------------------------
// Absorb field-naming variance from the Python backend so the UI never
// breaks regardless of the exact schema shared/schemas.py produces.

function normalizeControl(c) {
  const health = Math.round(c.health ?? c.health_score ?? c.score ?? 0)
  const status = c.status || (health >= 80 ? 'healthy' : health >= 50 ? 'drifting' : 'critical')
  return {
    control_id: c.control_id ?? c.id ?? c.name,
    name: c.name ?? c.control_name ?? c.control_id ?? 'Unnamed Control',
    system: c.system ?? c.provider ?? c.system_group ?? 'Other',
    health,
    status,
    drift_count: c.drift_count ?? c.driftCount ?? 0,
    category: c.category ?? c.domain ?? c.universal_category ?? '—',
    last_checked: c.last_checked ?? c.updated_at ?? null,
    description: c.description ?? null,
  }
}

function stringifyKV(obj) {
  if (obj == null) return '—'
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj)
  if (typeof obj === 'string') return obj
  if (typeof obj === 'object') return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' · ')
  return String(obj)
}

export function normalizeDrift(d) {
  return {
    drift_id: d.drift_id ?? d.id,
    control_id: d.control_id ?? d.control,
    control: d.control ?? d.control_name ?? d.control_id ?? 'Unknown control',
    title: d.title ?? d.summary ?? (d.narrative ? d.narrative.split('.')[0] : null) ?? `${d.control_id ?? d.control ?? 'Control'} drift detected`,
    severity: (d.severity ?? 'MEDIUM').toUpperCase(),
    description: d.description ?? d.details ?? d.narrative ?? '',
    expected: stringifyKV(d.expected ?? d.expected_value ?? d.baseline_value),
    actual: stringifyKV(d.actual ?? d.actual_value ?? d.current_value),
    detected_by: d.detected_by ?? d.changed_by ?? 'Secure Baseline Drift Detection Engine',
    timestamp: d.timestamp ?? d.detected_at ?? d.created_at ?? null,
    affected_resources: d.affected_resources ?? d.resources ?? (d.resource_id ? [d.resource_id] : []),
    remediation_steps: d.remediation_steps ?? d.remediation ?? [],
    suppressed: !!d.suppressed,
    category: d.category ?? d.domain ?? d.universal_category ?? '—',
    system: d.system ?? d.provider ?? '—',
    parameter: d.parameter ?? '—',
    compliance: d.compliance_mappings ?? null,
    drift_score: d.drift_score ?? null,
    source_event_id: d.source_event_id ?? null,
    actor_trust_score: d.actor_trust_score ?? null,
  }
}

export function normalizeGraph(g) {
  if (!g) return { nodes: [], edges: [], blast_radius: 0, critical_path: [] }
  const nodes = (g.nodes ?? []).map((n) => {
    if (Array.isArray(n)) {
      const id = n[0]
      const attrs = n[1] ?? {}
      return {
        id,
        label: attrs.label ?? attrs.name ?? id,
        type: attrs.type ?? attrs.node_type ?? 'asset',
        status: attrs.status ?? (attrs.compromised ? 'critical' : 'healthy'),
        note: attrs.note ?? attrs.state ?? attrs.environment ?? null,
      }
    }
    return {
      id: n.id ?? n.node_id ?? n.name,
      label: n.label ?? n.name ?? n.id,
      type: n.type ?? n.node_type ?? 'asset',
      status: n.status ?? (n.compromised ? 'critical' : 'healthy'),
      note: n.note ?? n.state,
    }
  })
  const edges = (g.edges ?? g.links ?? []).map((e) => {
    if (Array.isArray(e)) {
      const source = e[0]
      const target = e[1]
      const attrs = e[2] ?? {}
      return {
        source,
        target,
        type: attrs.kind ?? attrs.type ?? attrs.relation ?? 'propagation',
      }
    }
    return {
      source: e.source ?? e.from,
      target: e.target ?? e.to,
      type: e.kind ?? e.type ?? 'propagation',
    }
  })
  return {
    nodes,
    edges,
    blast_radius: g.blast_radius ?? g.metrics?.blast_radius ?? edges.length,
    critical_path: g.critical_path ?? g.metrics?.critical_path ?? [],
  }
}


function toSystems(controls) {
  const map = {}
  controls.forEach((c) => {
    map[c.system] = map[c.system] || []
    map[c.system].push(c)
  })
  return Object.entries(map).map(([name, list]) => ({ name, controls: list }))
}

function computeSummary(controls) {
  const healthy = controls.filter((c) => c.status === 'healthy').length
  const drifting = controls.filter((c) => c.status === 'drifting').length
  const critical = controls.filter((c) => c.status === 'critical').length
  const avg = controls.length ? Math.round(controls.reduce((s, c) => s + c.health, 0) / controls.length) : 0
  return { total_controls: controls.length, healthy, drifting, critical, avg_health: avg }
}

export function AppProvider({ children }) {
  const [scenario, setScenario] = useState('normal')
  const [liveBackend, setLiveBackend] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [live, setLive] = useState(null) // normalized live data, or null if unavailable

  const load = useCallback(async () => {
    setLoading(true)
    const [controlsRes, drfitsRes, graphRes, trustRes] = await Promise.all([
      api.getControls(),
      api.getDrifts(),
      api.getAttackGraph(),
      api.getTrust(),
    ])

    const gotControls = controlsRes.source === 'live'
    const gotDrifts = drfitsRes.source === 'live'

    if (!gotControls && !gotDrifts) {
      setLiveBackend(false)
      setError(controlsRes.error || drfitsRes.error)
      setLive(null)
      setLoading(false)
      return
    }

    const rawControls = Array.isArray(controlsRes.data)
      ? controlsRes.data
      : (controlsRes.data?.controls ?? controlsRes.data?.Controls ?? [])
    const rawDrifts = drfitsRes.data?.drifts ?? (Array.isArray(drfitsRes.data) ? drfitsRes.data : [])

    const drifts = rawDrifts.map(normalizeDrift).sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))

    const controls = rawControls.map((c) => {
      const normalized = normalizeControl(c)
      const matchingDrifts = drifts.filter((d) => d.control_id === normalized.control_id && !d.suppressed)
      if (matchingDrifts.length === 0) {
        normalized.health = 100
        normalized.status = 'healthy'
        normalized.drift_count = 0
      } else {
        normalized.drift_count = matchingDrifts.length
        const severities = matchingDrifts.map((d) => d.severity.toUpperCase())
        if (severities.includes('CRITICAL')) {
          normalized.health = 30
          normalized.status = 'critical'
        } else if (severities.includes('HIGH')) {
          normalized.health = 55
          normalized.status = 'drifting'
        } else if (severities.includes('MEDIUM')) {
          normalized.health = 75
          normalized.status = 'drifting'
        } else {
          normalized.health = 85
          normalized.status = 'healthy'
        }
      }
      return normalized
    })

    const graph = graphRes.source === 'live' ? normalizeGraph(graphRes.data) : SCENARIOS.normal.graph
    const trust = trustRes.source === 'live' ? (Array.isArray(trustRes.data) ? trustRes.data : trustRes.data?.trust ?? TRUST) : TRUST

    setLive({ controls, systems: toSystems(controls), drifts, graph, trust, summary: computeSummary(controls) })
    setLiveBackend(true)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const active = liveBackend && live ? live : SCENARIOS[scenario]

  const value = {
    ...active,
    scenario,
    setScenario,
    liveBackend,
    loading,
    error,
    refresh: load,
    apiBaseUrl: api.baseUrl,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
