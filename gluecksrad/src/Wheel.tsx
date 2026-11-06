import type { Person } from './types'
import { isLocked } from './types'

const COLORS = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231',
  '#911eb4', '#0f9db5', '#d4a017', '#c2185b',
]
const LOCKED_COLOR = '#b8bcc4'
const RADIUS = 100

interface WheelProps {
  persons: Person[]
  now: number
  rotation: number
  durationMs: number
}

/** Punkt auf dem Kreis; Winkel 0° = oben, im Uhrzeigersinn */
function point(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [r * Math.sin(rad), -r * Math.cos(rad)]
}

function segmentPath(start: number, end: number): string {
  const [x1, y1] = point(start, RADIUS)
  const [x2, y2] = point(end, RADIUS)
  const largeArc = end - start > 180 ? 1 : 0
  return `M 0 0 L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function shorten(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name
}

export function Wheel({ persons, now, rotation, durationMs }: WheelProps) {
  const n = persons.length
  const seg = n > 0 ? 360 / n : 360
  const fontSize = n <= 8 ? 9 : n <= 16 ? 7 : n <= 30 ? 5 : 3.5
  const maxChars = n <= 8 ? 14 : 18

  return (
    <div className="wheel-wrap">
      <div className="wheel-pointer" aria-hidden="true" />
      <svg
        className="wheel"
        viewBox="-104 -104 208 208"
        role="img"
        aria-label={`Glücksrad mit ${n} Namen`}
      >
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: `transform ${durationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`,
          }}
        >
          {n === 0 && <circle r={RADIUS} fill={LOCKED_COLOR} />}
          {persons.map((p, i) => {
            const locked = isLocked(p, now)
            const fill = locked ? LOCKED_COLOR : COLORS[i % COLORS.length]
            const center = (i + 0.5) * seg
            return (
              <g key={p.id}>
                {n === 1 ? (
                  <circle r={RADIUS} fill={fill} />
                ) : (
                  <path d={segmentPath(i * seg, (i + 1) * seg)} fill={fill} stroke="#fff" strokeWidth={0.6} />
                )}
                <text
                  transform={`rotate(${center - 90}) translate(${RADIUS - 8} 0)`}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={fontSize}
                  fill={locked ? '#555' : '#fff'}
                  fontWeight={600}
                >
                  {shorten(p.name, maxChars)}
                </text>
              </g>
            )
          })}
        </g>
        <circle r={10} fill="#fff" stroke="#333" strokeWidth={1.5} />
      </svg>
    </div>
  )
}
