import { useMemo, useState } from 'react'
import { Share2 } from 'lucide-react'

function layoutNodes(nodes, edges, width, height) {
  const incoming = new Set(edges.map((e) => e.target))
  const roots = nodes.filter((n) => !incoming.has(n.id)).map((n) => n.id)
  const queue = roots.length ? [...roots] : [nodes[0]?.id].filter(Boolean)
  const visited = new Set(queue)
  const depth = {}
  queue.forEach((id) => (depth[id] = 0))

  let i = 0
  const maxIterations = nodes.length * 4 + 50
  let iterations = 0
  while (i < queue.length && iterations < maxIterations) {
    const cur = queue[i++]
    edges
      .filter((e) => e.source === cur)
      .forEach((e) => {
        iterations++
        if (!visited.has(e.target)) {
          visited.add(e.target)
          depth[e.target] = depth[cur] + 1
          queue.push(e.target)
        }
      })
  }
  nodes.forEach((n) => { if (depth[n.id] === undefined) depth[n.id] = 0 })

  const maxDepth = Math.max(...Object.values(depth), 1)
  const byDepth = {}
  nodes.forEach((n) => { (byDepth[depth[n.id]] ||= []).push(n.id) })

  const positions = {}
  Object.entries(byDepth).forEach(([d, ids]) => {
    const x = 60 + (Number(d) / maxDepth) * (width - 120)
    ids.forEach((id, j) => {
      positions[id] = { x, y: (height / (ids.length + 1)) * (j + 1) }
    })
  })
  return positions
}

const TYPE_COLOR = {
  exploit: '#E74C3C',
  control: '#F39C12',
  asset:   '#2ECC71',
  impact:  '#E74C3C',
}

function nodeColor(n) {
  if (n.status === 'critical') return '#E74C3C'
  if (n.status === 'warning')  return '#F39C12'
  if (n.status === 'healthy')  return '#2ECC71'
  return TYPE_COLOR[n.type] || '#94A3B8'
}

export default function AttackGraph({ graph, compact = false, height = 420 }) {
  const width = compact ? 480 : 1100
  const H = compact ? 240 : height
  const positions = useMemo(() => layoutNodes(graph.nodes, graph.edges, width, H), [graph, width, H])
  const [hovered, setHovered] = useState(null)

  const isCritical = (s, t) => {
    const path = graph.critical_path || []
    const si = path.indexOf(s)
    return si !== -1 && path[si + 1] === t
  }

  if (graph.nodes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAED]">
          <h3 className="text-sm font-semibold text-[#1A2332]">
            {compact ? 'Blast Radius Visualization' : 'Attack Graph'}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <Share2 className="w-8 h-8 text-[#C8D6D4] mb-2" />
          <p className="text-[13px] text-[#8B95A1]">No attack graph data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E8EAED] shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EAED]">
        <h3 className="text-sm font-semibold text-[#1A2332]">
          {compact ? 'Blast Radius Visualization' : 'Attack Graph'}
        </h3>
        {!compact && (
          <span className="text-[11px] font-medium text-[#8B95A1] bg-[#F4F6F8] px-2 py-0.5 rounded-md">
            Blast radius: <span className="font-bold text-[#1A2332] font-mono">{graph.blast_radius}</span> hops
          </span>
        )}
      </div>

      <div
        role="img"
        aria-label={`Attack graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`}
        className="overflow-x-auto px-3 py-3"
      >
        <svg viewBox={`0 0 ${width} ${H}`} width="100%" height={H} className="min-w-[400px]">
          {/* Edges */}
          {graph.edges.map((e, i) => {
            const s = positions[e.source]
            const t = positions[e.target]
            if (!s || !t) return null
            const critical = isCritical(e.source, e.target)
            return (
              <line
                key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={critical ? '#E74C3C' : '#CBD5E1'}
                strokeWidth={critical ? 2 : 1.5}
                strokeDasharray={e.type === 'propagation' ? '4 3' : undefined}
                opacity={critical ? 1 : 0.7}
              />
            )
          })}

          {/* Nodes */}
          {graph.nodes.map((n) => {
            const p = positions[n.id]
            if (!p) return null
            const r = compact ? 14 : 20
            const color = nodeColor(n)
            const isHov = hovered === n.id
            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="button"
                aria-label={`Node: ${n.label}, type: ${n.type}, status: ${n.status || 'unknown'}`}
                className="cursor-pointer outline-none"
                style={{ transition: 'transform 0.1s' }}
              >
                {/* Glow ring on hover */}
                <circle r={r + 6} fill={color} opacity={isHov ? 0.15 : 0} style={{ transition: 'opacity 0.15s' }} />
                {/* Main circle */}
                <circle r={r} fill={color} opacity={0.92} />
                {/* Abbreviation label inside */}
                <text textAnchor="middle" dy="0.35em" fontSize={compact ? 9 : 11} fill="white" fontWeight="700">
                  {n.label.split(' ')[0].slice(0, 3).toUpperCase()}
                </text>
                {/* Node name below */}
                <text textAnchor="middle" y={r + (compact ? 13 : 17)} fontSize={compact ? 9 : 10} fill="#4B5563" fontWeight="600">
                  {n.label}
                </text>
                {!compact && n.note && (
                  <text textAnchor="middle" y={r + 29} fontSize={9} fill="#94A3B8">{n.note}</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-[#E8EAED] text-[11px] text-[#8B95A1]">
          <LegendDot color="#E74C3C" label="Exploit / Critical" />
          <LegendDot color="#F39C12" label="Control / Warning" />
          <LegendDot color="#2ECC71" label="Asset / Safe" />
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-400 inline-block rounded" /> Critical Path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t border-dashed border-[#94A3B8] inline-block" /> Propagation
          </span>
        </div>
      )}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
