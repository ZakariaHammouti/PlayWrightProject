import type { Person } from './types'

const STORAGE_KEY = 'gluecksrad.personen.v1'

function isPerson(value: unknown): value is Person {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.drawCount === 'number' &&
    (p.lastDrawnAt === null || typeof p.lastDrawnAt === 'number') &&
    (p.lockedUntil === null || typeof p.lockedUntil === 'number')
  )
}

export function loadPersons(): Person[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data: unknown = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isPerson) : []
  } catch {
    return []
  }
}

export function savePersons(persons: Person[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persons))
  } catch {
    // localStorage nicht verfügbar (z. B. privater Modus) – App läuft trotzdem weiter
  }
}
