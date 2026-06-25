import { useRef, useEffect, useState, useCallback } from 'react'
import type { GlobalNetworkNode, GlobalNetworkEdge } from '@/types/api'

export const COMMUNITY_COLORS = [
  '#ff6b35', '#22d3ee', '#a78bfa', '#34d399', '#f59e0b',
  '#f87171', '#60a5fa', '#e879f9', '#fb923c', '#4ade80',
]

interface Props {
  nodes: GlobalNetworkNode[]
  edges: GlobalNetworkEdge[]
}

interface SimNode extends GlobalNetworkNode {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface TooltipState {
  node: GlobalNetworkNode
  x: number
  y: number
}

function buildEdgeIndex(edges: GlobalNetworkEdge[]): Map<string, Set<string>> {
  const idx = new Map<string, Set<string>>()
  for (const e of edges) {
    if (!idx.has(e.source)) idx.set(e.source, new Set())
    if (!idx.has(e.target)) idx.set(e.target, new Set())
    idx.get(e.source)!.add(e.target)
    idx.get(e.target)!.add(e.source)
  }
  return idx
}

function runLayout(simNodes: SimNode[], edgeIdx: Map<string, Set<string>>, W: number, H: number) {
  const cx = W / 2
  const cy = H / 2
  const iterations = 200

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations

    // Repulsion between all pairs
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i]!
        const b = simNodes[j]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = (800 * 800) / dist
        const fx = (dx / dist) * repulsion
        const fy = (dy / dist) * repulsion
        a.vx -= fx * 0.001
        a.vy -= fy * 0.001
        b.vx += fx * 0.001
        b.vy += fy * 0.001
      }
    }

    // Attraction along edges
    for (const n of simNodes) {
      const neighbors = edgeIdx.get(n.id)
      if (!neighbors) continue
      for (const nid of neighbors) {
        const nb = simNodes.find((s) => s.id === nid)
        if (!nb) continue
        const dx = nb.x - n.x
        const dy = nb.y - n.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const target = 80
        const force = (dist - target) * 0.005
        n.vx += (dx / dist) * force
        n.vy += (dy / dist) * force
      }
    }

    // Gravity toward center
    for (const n of simNodes) {
      n.vx += (cx - n.x) * 0.002
      n.vy += (cy - n.y) * 0.002
    }

    // Apply velocities with cooling
    for (const n of simNodes) {
      n.x += n.vx * cooling
      n.y += n.vy * cooling
      n.vx *= 0.8
      n.vy *= 0.8
      // Clamp to canvas
      n.x = Math.max(n.radius + 4, Math.min(W - n.radius - 4, n.x))
      n.y = Math.max(n.radius + 4, Math.min(H - n.radius - 4, n.y))
    }
  }
}

function drawGraph(
  ctx: CanvasRenderingContext2D,
  simNodes: SimNode[],
  edges: GlobalNetworkEdge[],
  nodeIdx: Map<string, SimNode>,
  hovered: string | null,
) {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0d0d14'
  ctx.fillRect(0, 0, W, H)

  // Draw edges
  for (const e of edges) {
    const a = nodeIdx.get(e.source)
    const b = nodeIdx.get(e.target)
    if (!a || !b) continue
    const isHighlighted = hovered === e.source || hovered === e.target
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = isHighlighted ? 'rgba(255,107,53,0.4)' : 'rgba(37,37,58,0.6)'
    ctx.lineWidth = isHighlighted ? 1.5 : 0.8
    ctx.stroke()
  }

  // Draw nodes
  for (const n of simNodes) {
    const color = COMMUNITY_COLORS[n.community_id % COMMUNITY_COLORS.length]!
    const isHov = n.id === hovered
    const r = isHov ? n.radius * 1.3 : n.radius

    ctx.beginPath()
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = isHov ? 1 : 0.85
    ctx.fill()

    if (isHov) {
      ctx.beginPath()
      ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.6
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  // Node labels for larger nodes
  ctx.font = '10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const n of simNodes) {
    if (n.radius >= 10 || n.id === hovered) {
      ctx.fillStyle = '#e8e8f0'
      ctx.globalAlpha = n.id === hovered ? 1 : 0.7
      ctx.fillText(n.name.split(' ')[0]!, n.x, n.y + n.radius + 10)
      ctx.globalAlpha = 1
    }
  }
}

export function NetworkGraph({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<SimNode[]>([])
  const nodeIdxRef = useRef<Map<string, SimNode>>(new Map())
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!nodes.length) return
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height

    const simNodes: SimNode[] = nodes.map((n, i) => ({
      ...n,
      radius: 5 + n.degree_centrality * 22,
      x: W / 2 + Math.cos((i / nodes.length) * Math.PI * 2) * (Math.min(W, H) * 0.35),
      y: H / 2 + Math.sin((i / nodes.length) * Math.PI * 2) * (Math.min(W, H) * 0.35),
      vx: 0,
      vy: 0,
    }))

    const edgeIdx = buildEdgeIndex(edges)
    runLayout(simNodes, edgeIdx, W, H)

    simRef.current = simNodes
    nodeIdxRef.current = new Map(simNodes.map((n) => [n.id, n]))
    setReady(true)
  }, [nodes, edges])

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !simRef.current.length) return
    drawGraph(ctx, simRef.current, edges, nodeIdxRef.current, hovered)
  }, [ready, edges, hovered])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width)
      const my = (e.clientY - rect.top) * (canvas.height / rect.height)

      let found: SimNode | null = null
      for (const n of simRef.current) {
        const dx = n.x - mx
        const dy = n.y - my
        if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
          found = n
          break
        }
      }

      if (found) {
        setHovered(found.id)
        setTooltip({ node: found, x: e.clientX, y: e.clientY })
      } else {
        setHovered(null)
        setTooltip(null)
      }
    },
    [],
  )

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
    setTooltip(null)
  }, [])

  if (!nodes.length) {
    return (
      <div
        className="flex items-center justify-center h-64 rounded-lg border text-sm"
        style={{ borderColor: '#25253a', color: '#6b6b8a', background: '#13131f' }}
      >
        No network data
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        style={{ width: '100%', height: '100%', display: 'block', cursor: hovered ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            pointerEvents: 'none',
            zIndex: 50,
            background: '#13131f',
            border: '1px solid #25253a',
            borderRadius: 8,
            padding: '8px 12px',
            minWidth: 160,
          }}
        >
          <div className="font-semibold text-sm mb-1" style={{ color: '#e8e8f0' }}>
            {tooltip.node.name}
          </div>
          {tooltip.node.genre && (
            <div className="text-xs mb-2" style={{ color: '#6b6b8a' }}>{tooltip.node.genre}</div>
          )}
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between gap-4">
              <span style={{ color: '#6b6b8a' }}>Centrality</span>
              <span style={{ color: '#ff6b35' }}>{(tooltip.node.degree_centrality * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: '#6b6b8a' }}>Betweenness</span>
              <span style={{ color: '#ff6b35' }}>{(tooltip.node.betweenness * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span style={{ color: '#6b6b8a' }}>Clustering</span>
              <span style={{ color: '#ff6b35' }}>{tooltip.node.clustering.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
