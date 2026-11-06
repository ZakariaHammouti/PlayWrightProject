/**
 * Farben für die Segmente des Glücksrads.
 *
 * Jede Person bekommt eine eigene Farbe – keine Farbe kommt doppelt vor.
 * Die Farbtöne werden mit dem „goldenen Winkel“ (≈ 137,5°) verteilt: So
 * unterscheiden sich benachbarte Segmente deutlich, und es entstehen
 * auch bei vielen Personen nie zwei gleiche Farben.
 */

const GOLDEN_ANGLE = 137.508
const START_HUE = 350
const LIGHTNESS = [46, 36, 56] // leicht wechselnde Helligkeit für mehr Unterschied

export interface SegmentColor {
  fill: string
  text: string
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/** Relative Helligkeit nach WCAG */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function segmentColor(index: number): SegmentColor {
  const hue = (START_HUE + index * GOLDEN_ANGLE) % 360
  const saturation = 70
  const lightness = LIGHTNESS[index % LIGHTNESS.length]
  const lum = luminance(hslToRgb(hue, saturation, lightness))
  // Schrift weiß oder dunkel – je nachdem, was auf der Farbe besser lesbar ist
  const contrastWhite = 1.05 / (lum + 0.05)
  const contrastDark = (lum + 0.05) / 0.05
  return {
    fill: `hsl(${hue.toFixed(1)} ${saturation}% ${lightness}%)`,
    text: contrastWhite >= contrastDark ? '#ffffff' : '#1d2130',
  }
}
