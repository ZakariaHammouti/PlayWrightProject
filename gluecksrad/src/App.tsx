import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Wheel } from './Wheel'
import { Celebration } from './Celebration'
import { LOCK_DURATION_MS, isLocked } from './types'
import type { Person } from './types'
import { loadPersons, savePersons } from './storage'
import { randomIndex, secureRandom } from './random'
import { loadSoundEnabled, playFanfare, saveSoundEnabled, unlockAudio } from './sound'
import './App.css'

const SPIN_MS = 4500
const REDUCED_SPIN_MS = 300

/** Name bereinigen: Leerzeichen am Rand entfernen, mehrfache Leerzeichen zusammenfassen */
function cleanName(raw: string): string {
  return raw.normalize('NFC').replace(/\s+/g, ' ').trim()
}

/** Vergleichsschlüssel für Duplikate: bereinigt und ohne Groß-/Kleinschreibung */
function nameKey(name: string): string {
  return cleanName(name).toLocaleLowerCase('de-DE')
}

function newId(): string {
  return crypto.randomUUID()
}

function formatDate(ms: number | null): string {
  if (ms === null) return '–'
  return new Date(ms).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatRemaining(ms: number): string {
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function App() {
  const [persons, setPersons] = useState<Person[]>(() => loadPersons())
  const [now, setNow] = useState(() => Date.now())
  const [rotation, setRotation] = useState(0)
  const [spinMs, setSpinMs] = useState(SPIN_MS)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Person | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [soundOn, setSoundOn] = useState(() => loadSoundEnabled())
  const soundOnRef = useRef(soundOn)
  const [singleName, setSingleName] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [message, setMessage] = useState('')
  const [messageIsWarning, setMessageIsWarning] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')
  const spinTimer = useRef<number | undefined>(undefined)

  // Speichern bei jeder Änderung
  useEffect(() => savePersons(persons), [persons])

  useEffect(() => {
    soundOnRef.current = soundOn
    saveSoundEnabled(soundOn)
  }, [soundOn])

  // Uhr für Sperr-Restzeiten
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => () => window.clearTimeout(spinTimer.current), [])

  const available = useMemo(() => persons.filter((p) => !isLocked(p, now)), [persons, now])

  interface AddResult {
    added: number
    duplicates: string[]
  }

  function addNames(names: string[]): AddResult {
    const existing = new Set(persons.map((p) => nameKey(p.name)))
    const toAdd: Person[] = []
    const duplicates: string[] = []
    for (const raw of names) {
      const name = cleanName(raw)
      if (!name) continue
      const key = nameKey(name)
      if (existing.has(key)) {
        duplicates.push(name)
        continue
      }
      existing.add(key)
      toAdd.push({ id: newId(), name, drawCount: 0, lastDrawnAt: null, lockedUntil: null })
    }
    if (toAdd.length) setPersons((prev) => [...prev, ...toAdd])
    return { added: toAdd.length, duplicates }
  }

  function report({ added, duplicates }: AddResult) {
    const parts: string[] = []
    if (added) parts.push(`${added} Name${added === 1 ? '' : 'n'} hinzugefügt.`)
    if (duplicates.length) {
      const list = duplicates.map((d) => `„${d}“`).join(', ')
      parts.push(
        duplicates.length === 1
          ? `${list} ist schon vorhanden und wurde nicht hinzugefügt.`
          : `Schon vorhanden und nicht hinzugefügt: ${list}.`,
      )
    }
    setMessage(parts.join(' '))
    setMessageIsWarning(duplicates.length > 0)
  }

  function onAddSingle(e: FormEvent) {
    e.preventDefault()
    const result = addNames([singleName])
    report(result)
    // Bei einem Duplikat bleibt der Name im Feld stehen, damit man ihn korrigieren kann
    if (result.added) setSingleName('')
  }

  function onAddBulk(e: FormEvent) {
    e.preventDefault()
    report(addNames(bulkText.split(/\r?\n/)))
    setBulkText('')
  }

  function removePerson(p: Person) {
    if (!window.confirm(`„${p.name}“ wirklich löschen? Die Statistik geht dabei verloren.`)) return
    setPersons((prev) => prev.filter((x) => x.id !== p.id))
    if (winner?.id === p.id) setWinner(null)
  }

  function removeAll() {
    if (!window.confirm('Wirklich alle Namen und die gesamte Statistik löschen?')) return
    setPersons([])
    setWinner(null)
    setMessage('')
  }

  function startEdit(p: Person) {
    setEditingId(p.id)
    setEditValue(p.name)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    const name = cleanName(editValue)
    if (!name) {
      setEditError('Der Name darf nicht leer sein.')
      return
    }
    const key = nameKey(name)
    const clash = persons.find((p) => p.id !== editingId && nameKey(p.name) === key)
    if (clash) {
      setEditError(`„${clash.name}“ ist schon vorhanden.`)
      return
    }
    setPersons((prev) => prev.map((x) => (x.id === editingId ? { ...x, name } : x)))
    if (winner?.id === editingId) setWinner({ ...winner, name })
    setEditingId(null)
    setEditError('')
  }

  function unlock(p: Person) {
    setPersons((prev) => prev.map((x) => (x.id === p.id ? { ...x, lockedUntil: null } : x)))
  }

  function spin() {
    setEditingId(null)
    const current = Date.now()
    setNow(current)
    const pool = persons.filter((p) => !isLocked(p, current))
    if (spinning || pool.length === 0) return

    const picked = pool[randomIndex(pool.length)]
    const index = persons.findIndex((p) => p.id === picked.id)
    const seg = 360 / persons.length
    // Zielwinkel: Segmentmitte plus kleine Zufallsabweichung innerhalb des Segments
    const target = (index + 0.5) * seg + (secureRandom() - 0.5) * seg * 0.7
    const delta = (((-target - rotation) % 360) + 360) % 360
    const duration = prefersReducedMotion() ? REDUCED_SPIN_MS : SPIN_MS

    if (soundOnRef.current) unlockAudio()
    setWinner(null)
    setSpinMs(duration)
    setSpinning(true)
    setRotation(rotation + 6 * 360 + delta)

    spinTimer.current = window.setTimeout(() => {
      const drawnAt = Date.now()
      const updated: Person = {
        ...picked,
        drawCount: picked.drawCount + 1,
        lastDrawnAt: drawnAt,
        lockedUntil: drawnAt + LOCK_DURATION_MS,
      }
      setPersons((prev) =>
        prev.map((x) =>
          x.id === picked.id
            ? { ...x, drawCount: x.drawCount + 1, lastDrawnAt: drawnAt, lockedUntil: drawnAt + LOCK_DURATION_MS }
            : x,
        ),
      )
      setNow(drawnAt)
      setWinner(updated)
      setCelebrating(true)
      if (soundOnRef.current) playFanfare()
      setSpinning(false)
    }, duration + 100)
  }

  const closeCelebration = useCallback(() => setCelebrating(false), [])

  const allLocked = persons.length > 0 && available.length === 0
  const nextUnlock = allLocked
    ? Math.min(...persons.map((p) => p.lockedUntil ?? Infinity))
    : null

  return (
    <div className="app">
      <header>
        <div className="header-row">
          <h1>Glücksrad</h1>
          <button
            className="subtle sound-toggle"
            onClick={() => {
              if (!soundOn) unlockAudio()
              setSoundOn(!soundOn)
            }}
            aria-pressed={soundOn}
            title={soundOn ? 'Ton ausschalten' : 'Ton einschalten'}
          >
            {soundOn ? '🔊 Ton an' : '🔇 Ton aus'}
          </button>
        </div>
        <p className="subtitle">
          {persons.length} Personen · {available.length} verfügbar · gezogene Personen sind 24 Stunden gesperrt
        </p>
      </header>

      <main className="layout">
        <section className="card wheel-card">
          <Wheel persons={persons} now={now} rotation={rotation} durationMs={spinMs} />

          <button
            className="spin-button"
            onClick={spin}
            disabled={spinning || available.length === 0}
          >
            {spinning ? 'Dreht …' : 'Rad drehen'}
          </button>

          <div className="result" aria-live="polite">
            {winner && (
              <>
                <span className="result-label">Gezogen:</span>
                <span className="result-name">{winner.name}</span>
              </>
            )}
            {!winner && persons.length === 0 && <span className="hint">Trage zuerst Namen ein.</span>}
            {!winner && allLocked && nextUnlock !== null && (
              <span className="hint">
                Alle Personen sind gesperrt. Die nächste Person ist in {formatRemaining(nextUnlock - now)} wieder
                verfügbar, oder du hebst eine Sperre in der Statistik auf.
              </span>
            )}
          </div>
        </section>

        <section className="card">
          <h2>Namen hinzufügen</h2>
          <form onSubmit={onAddSingle} className="row">
            <input
              type="text"
              value={singleName}
              onChange={(e) => setSingleName(e.target.value)}
              placeholder="Name eingeben"
              aria-label="Einzelnen Namen eingeben"
              disabled={spinning}
            />
            <button type="submit" disabled={spinning || !singleName.trim()}>
              Hinzufügen
            </button>
          </form>

          <form onSubmit={onAddBulk} className="bulk">
            <label htmlFor="bulk">Liste einfügen (ein Name pro Zeile)</label>
            <textarea
              id="bulk"
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'Anna Müller\nBen Schmidt\n…'}
              disabled={spinning}
            />
            <button type="submit" disabled={spinning || !bulkText.trim()}>
              Liste übernehmen
            </button>
          </form>
          {message && (
            <p className={messageIsWarning ? 'message warning' : 'message'} role="status">
              {message}
            </p>
          )}
        </section>

        <section className="card stats-card">
          <div className="stats-head">
            <h2>Statistik</h2>
            {persons.length > 0 && (
              <button className="danger subtle" onClick={removeAll} disabled={spinning}>
                Alle löschen
              </button>
            )}
          </div>
          {persons.length === 0 ? (
            <p className="hint">Noch keine Namen eingetragen.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="num">Ziehungen</th>
                    <th>Zuletzt gezogen</th>
                    <th>Status</th>
                    <th aria-label="Aktionen" />
                  </tr>
                </thead>
                <tbody>
                  {persons.map((p) => {
                    const locked = isLocked(p, now)
                    return (
                      <tr key={p.id}>
                        <td className="name-cell">
                          {editingId === p.id ? (
                            <form className="edit-form" onSubmit={saveEdit}>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value)
                                  setEditError('')
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                                aria-label={`Neuer Name für ${p.name}`}
                                aria-invalid={editError ? true : undefined}
                                autoFocus
                              />
                              <button type="submit" className="subtle">
                                Speichern
                              </button>
                              <button type="button" className="subtle" onClick={cancelEdit}>
                                Abbrechen
                              </button>
                              {editError && <span className="edit-error">{editError}</span>}
                            </form>
                          ) : (
                            p.name
                          )}
                        </td>
                        <td className="num">{p.drawCount}</td>
                        <td>{formatDate(p.lastDrawnAt)}</td>
                        <td>
                          {locked && p.lockedUntil !== null ? (
                            <span className="badge locked">gesperrt, noch {formatRemaining(p.lockedUntil - now)}</span>
                          ) : (
                            <span className="badge free">verfügbar</span>
                          )}
                        </td>
                        <td className="actions">
                          {locked && (
                            <button className="subtle" onClick={() => unlock(p)} disabled={spinning}>
                              Sperre aufheben
                            </button>
                          )}
                          {editingId !== p.id && (
                            <button className="subtle" onClick={() => startEdit(p)} disabled={spinning}>
                              Bearbeiten
                            </button>
                          )}
                          <button className="danger subtle" onClick={() => removePerson(p)} disabled={spinning}>
                            Löschen
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {celebrating && winner && <Celebration name={winner.name} onClose={closeCelebration} />}
    </div>
  )
}
