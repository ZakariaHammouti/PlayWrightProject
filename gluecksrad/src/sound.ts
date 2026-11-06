/**
 * Töne werden direkt im Browser mit der Web Audio API erzeugt –
 * es werden keine Audio-Dateien benötigt.
 */

const SOUND_KEY = 'gluecksrad.ton'

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (ctx) return ctx
  try {
    ctx = new AudioContext()
  } catch {
    ctx = null
  }
  return ctx
}

/**
 * Muss bei einem Klick aufgerufen werden: Browser erlauben Ton erst
 * nach einer Benutzeraktion.
 */
export function unlockAudio(): void {
  const c = getContext()
  if (c && c.state === 'suspended') void c.resume()
}

function tone(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void {
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Kurze Siegesfanfare: aufsteigende Töne und ein Schlussakkord */
export function playFanfare(): void {
  const c = getContext()
  if (!c) return
  const t = c.currentTime + 0.05

  // C5 – E5 – G5 – C6 (aufsteigend)
  const melody = [523.25, 659.25, 783.99, 1046.5]
  melody.forEach((f, i) => {
    tone(c, f, t + i * 0.12, 0.18, 'square', 0.08)
    tone(c, f, t + i * 0.12, 0.18, 'triangle', 0.12)
  })

  // Schlussakkord C-Dur
  const chordStart = t + melody.length * 0.12 + 0.05
  for (const f of [523.25, 659.25, 783.99, 1046.5]) {
    tone(c, f, chordStart, 1.1, 'triangle', 0.1)
  }
  tone(c, 261.63, chordStart, 1.1, 'sine', 0.15)

  // Glitzer am Ende
  ;[2093, 2637, 3136].forEach((f, i) => {
    tone(c, f, chordStart + 0.15 + i * 0.08, 0.25, 'sine', 0.04)
  })
}

export function loadSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'aus'
  } catch {
    return true
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'an' : 'aus')
  } catch {
    // ignorieren
  }
}
