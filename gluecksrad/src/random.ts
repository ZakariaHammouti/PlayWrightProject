/** Zufallszahl in [0, 1) aus dem kryptografischen Zufallsgenerator des Browsers */
export function secureRandom(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

/** Zufälliger ganzzahliger Index in [0, max) */
export function randomIndex(max: number): number {
  return Math.floor(secureRandom() * max)
}
