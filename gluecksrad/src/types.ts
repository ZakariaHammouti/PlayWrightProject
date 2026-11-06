export interface Person {
  id: string
  name: string
  /** Wie oft die Person gezogen wurde */
  drawCount: number
  /** Zeitpunkt der letzten Ziehung (ms seit 1970) */
  lastDrawnAt: number | null
  /** Bis zu diesem Zeitpunkt (ms) ist die Person gesperrt */
  lockedUntil: number | null
}

/** Dauer der Sperre nach einer Ziehung: 24 Stunden */
export const LOCK_DURATION_MS = 24 * 60 * 60 * 1000

/** Mindestanzahl verfügbarer Personen, damit gedreht werden kann – bei nur einer stünde das Ergebnis fest */
export const MIN_AVAILABLE_TO_SPIN = 2

export function isLocked(person: Person, now: number): boolean {
  return person.lockedUntil !== null && person.lockedUntil > now
}
