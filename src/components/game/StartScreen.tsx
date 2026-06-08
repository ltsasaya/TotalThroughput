import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { DifficultyMode } from '@/types/game'
import InstructionalPopup from './InstructionalPopup'
import { LearnSection } from './LearnSection'

const DEFAULT_DIFFICULTY: DifficultyMode = 'standard'

interface NetworkNode {
  x: number
  y: number
  id: number
  type: 'edge' | 'hub'
  connectedTo?: number
}

const HUB_POSITIONS = [
  { x: 18, y: 15 },
  { x: 82, y: 12 },
  { x: 12, y: 85 },
  { x: 88, y: 88 },
]

const EDGE_CLUSTERS = [
  [
    { x: 8, y: 10 },
    { x: 12, y: 22 },
    { x: 25, y: 12 },
    { x: 22, y: 25 },
  ],
  [
    { x: 94, y: 16 },
    { x: 88, y: 20 },
    { x: 75, y: 10 },
    { x: 78, y: 22 },
  ],
  [
    { x: 5, y: 88 },
    { x: 10, y: 78 },
    { x: 20, y: 90 },
    { x: 18, y: 78 },
  ],
  [
    { x: 95, y: 92 },
    { x: 92, y: 82 },
    { x: 82, y: 92 },
    { x: 76, y: 84 },
  ],
]

function NetworkVisualization() {
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [buttonCenter, setButtonCenter] = useState({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const generatedNodes: NetworkNode[] = HUB_POSITIONS.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      id: i,
      type: 'hub',
    }))

    EDGE_CLUSTERS.forEach((cluster, hubIdx) => {
      cluster.forEach((pos, edgeIdx) => {
        generatedNodes.push({
          x: pos.x,
          y: pos.y,
          id: HUB_POSITIONS.length + hubIdx * cluster.length + edgeIdx,
          type: 'edge',
          connectedTo: hubIdx,
        })
      })
    })

    setNodes(generatedNodes)
  }, [])

  useEffect(() => {
    const updateButtonPosition = () => {
      const button = document.getElementById('play-button')
      setViewport({ width: window.innerWidth, height: window.innerHeight })

      if (button) {
        const rect = button.getBoundingClientRect()
        setButtonCenter({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }
    }

    updateButtonPosition()
    window.addEventListener('resize', updateButtonPosition)

    return () => window.removeEventListener('resize', updateButtonPosition)
  }, [])

  if (nodes.length === 0 || buttonCenter.x === 0 || viewport.width === 0) return null

  const getNodePosition = (nodeId: number) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return { x: 0, y: 0 }

    return {
      x: (node.x / 100) * viewport.width,
      y: (node.y / 100) * viewport.height,
    }
  }

  return (
    <svg className="retro-start-network" aria-hidden="true">
      <g>
        {nodes
          .filter(node => node.type === 'hub')
          .map(hub => {
            const hubPos = getNodePosition(hub.id)
            return (
              <line
                key={`hub-line-${hub.id}`}
                x1={hubPos.x}
                y1={hubPos.y}
                x2={buttonCenter.x}
                y2={buttonCenter.y}
                stroke="black"
                strokeWidth="1.5"
                opacity="0.12"
              />
            )
          })}

        {nodes
          .filter(node => node.type === 'edge')
          .map(edge => {
            if (edge.connectedTo === undefined) return null

            const edgePos = getNodePosition(edge.id)
            const hubPos = getNodePosition(edge.connectedTo)
            return (
              <line
                key={`edge-line-${edge.id}`}
                x1={edgePos.x}
                y1={edgePos.y}
                x2={hubPos.x}
                y2={hubPos.y}
                stroke="black"
                strokeWidth="1.5"
                opacity="0.08"
              />
            )
          })}
      </g>

      <g>
        {nodes.map(node => {
          const pos = getNodePosition(node.id)
          return (
            <g key={`node-${node.id}`}>
              {node.type === 'hub' ? (
                <>
                  <rect x={pos.x - 6} y={pos.y - 6} width="12" height="12" fill="white" />
                  <rect
                    x={pos.x - 5}
                    y={pos.y - 5}
                    width="10"
                    height="10"
                    fill="black"
                    opacity="0.3"
                  />
                </>
              ) : (
                <>
                  <circle cx={pos.x} cy={pos.y} r="4" fill="white" />
                  <circle cx={pos.x} cy={pos.y} r="3" fill="black" opacity="0.25" />
                </>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

export function StartScreen() {
  const startGame = useGameStore(s => s.startGame)
  const [showPrePhase1Popup, setShowPrePhase1Popup] = useState(false)

  return (
    <div className="app-shell">
      <section className="retro-start-shell" aria-label="Total Throughput start screen">
        <NetworkVisualization />
        <div className="retro-start-scanlines" aria-hidden="true" />

        <header className="retro-start-nav" aria-label="Placeholder navigation">
          <span className="retro-start-nav-link">For Instructors</span>
          <div className="retro-start-nav-actions">
            <button type="button" disabled className="retro-start-signin">
              Sign in
            </button>
          </div>
        </header>

        <main className="retro-start-main">
          <h1 className="retro-start-title">Total Throughput</h1>

          <div className="retro-start-actions" aria-label="Start actions">
            <button
              type="button"
              id="play-button"
              className="retro-start-button retro-start-button-primary"
              onClick={() => setShowPrePhase1Popup(true)}
            >
              Play
            </button>
            <button
              type="button"
              disabled
              className="retro-start-button retro-start-button-secondary"
            >
              Join Class
            </button>
          </div>
        </main>
      </section>

      <LearnSection />

      {showPrePhase1Popup && (
        <InstructionalPopup
          id="prePhase1"
          onDismiss={() => { setShowPrePhase1Popup(false); startGame(DEFAULT_DIFFICULTY) }}
        />
      )}
    </div>
  )
}
