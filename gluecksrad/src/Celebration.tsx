import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import { secureRandom } from './random'

const CONFETTI_COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#0f9db5', '#ffd23f', '#ff6fb5']
const CONFETTI_COUNT = 90

interface CelebrationProps {
  name: string
  onClose: () => void
}

export function Celebration({ name, onClose }: CelebrationProps) {
  const closeButton = useRef<HTMLButtonElement>(null)

  // Konfetti-Teilchen einmalig pro Gratulation zufällig verteilen
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        style: {
          left: `${secureRandom() * 100}%`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          width: `${6 + secureRandom() * 6}px`,
          height: `${10 + secureRandom() * 8}px`,
          animationDelay: `${secureRandom() * 0.8}s`,
          animationDuration: `${2.4 + secureRandom() * 1.8}s`,
          '--drift': `${(secureRandom() - 0.5) * 240}px`,
          '--spin': `${(secureRandom() > 0.5 ? 1 : -1) * (360 + secureRandom() * 720)}deg`,
        } as CSSProperties,
      })),
    [],
  )

  useEffect(() => {
    closeButton.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title" onClick={onClose}>
      <div className="confetti" aria-hidden="true">
        {pieces.map((p) => (
          <span key={p.id} className="confetti-piece" style={p.style} />
        ))}
      </div>
      <div className="celebration-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebration-emoji" aria-hidden="true">🎉</div>
        <p id="celebration-title" className="celebration-title">Herzlichen Glückwunsch!</p>
        <p className="celebration-name">{name}</p>
        <p className="celebration-sub">Du bist dran!</p>
        <button ref={closeButton} onClick={onClose}>
          Weiter
        </button>
      </div>
    </div>
  )
}
