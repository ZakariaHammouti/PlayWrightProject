# Glücksrad für Studierende

Ein kleines Lernprojekt: ein Glücksrad im Browser, in das man die Namen von Studierenden einträgt und zufällig eine Person zieht.
Gebaut mit React, TypeScript und Vite. Es gibt keinen Server und keine Benutzerkonten. Alles läuft im Browser.

## Starten

Voraussetzung: Node.js (getestet mit Version 24).

```bash
cd gluecksrad
npm install
npm run dev
```

Danach die angezeigte Adresse im Browser öffnen, meist http://localhost:5173.

Weitere Befehle (im Ordner `gluecksrad`):

| Befehl | Zweck |
|---|---|
| `npm run build` | Typprüfung und Produktions-Build nach `dist/` |
| `npm run preview` | Den Build lokal ansehen |
| `npm run lint` | Code prüfen (oxlint) |

## Bedienung

1. **Namen eintragen**: einzeln über das Eingabefeld oder als Liste mit einem Namen pro Zeile (z. B. aus Excel kopiert).
   Doppelte Namen werden nicht übernommen. Groß- und Kleinschreibung sowie zusätzliche Leerzeichen zählen dabei nicht,
   „Anna Müller“, „anna müller“ und „ Anna  Müller “ gelten also als derselbe Name. Die übersprungenen Namen werden rot angezeigt.
2. **Rad drehen**: Das Rad dreht sich und bleibt bei einer zufälligen Person stehen.
   Danach erscheint eine Gratulation mit Konfetti und einer kurzen Fanfare.
3. **Sperre**: Die gezogene Person ist **24 Stunden gesperrt** und erscheint im Rad blass in ihrer Farbe.
   In der Statistik lässt sich die Sperre mit „Sperre aufheben“ vorzeitig beenden.
   Sind alle Personen gesperrt, kann das Rad nicht gedreht werden.
4. **Statistik**: Für jede Person sieht man die Anzahl der Ziehungen, die letzte Ziehung und den Status (verfügbar oder gesperrt mit Restzeit).
   Hier kann man Namen auch **bearbeiten** (Statistik und Sperre bleiben erhalten) sowie einzelne oder alle löschen.
   Auch beim Bearbeiten werden doppelte Namen abgelehnt.
5. **Ton**: Oben rechts lässt sich der Ton an- und ausschalten.

## Wo die Daten liegen

Alle Daten stehen im **localStorage** des Browsers:

| Schlüssel | Inhalt |
|---|---|
| `gluecksrad.personen.v1` | Namen, Anzahl der Ziehungen, letzte Ziehung und Sperrzeit pro Person |
| `gluecksrad.ton` | Ton an oder aus |

Die Daten gelten nur für diesen einen Browser auf diesem Rechner. Ein anderer Browser, ein anderes Gerät oder das Löschen der Browserdaten bedeutet eine leere Liste.
Die Namen landen deshalb auch nicht im Git-Repository.

## Aufbau des Codes

Der gesamte Code liegt in `gluecksrad/src/`:

| Datei | Aufgabe |
|---|---|
| `App.tsx` | Hauptseite: Namen verwalten, Rad drehen, Sperre, Statistik |
| `Wheel.tsx` | Zeichnet das Rad als SVG; gesperrte Personen werden blass dargestellt |
| `colors.ts` | Gibt jeder Person eine eigene Farbe; keine Farbe kommt doppelt vor |
| `Celebration.tsx` | Gratulationsfenster mit Konfetti-Animation |
| `sound.ts` | Fanfare, die direkt im Browser mit der Web Audio API erzeugt wird (ohne Audio-Dateien) |
| `storage.ts` | Daten im localStorage laden und speichern |
| `random.ts` | Zufallszahlen aus `crypto.getRandomValues` |
| `types.ts` | Datentyp `Person` und die Sperrdauer (24 Stunden) |
| `App.css`, `index.css` | Gestaltung, inklusive Dark Mode |

### So funktioniert eine Ziehung

1. Aus allen **nicht gesperrten** Personen wird zufällig eine ausgewählt.
2. Das Rad dreht sich mehrere Runden weiter und hält so an, dass der Zeiger oben auf dieser Person steht.
   Das Ergebnis steht also schon vor der Drehung fest, die Animation zeigt es nur an.
3. Nach der Drehung werden Anzahl der Ziehungen, Zeitpunkt der Ziehung und Sperrzeit (jetzt + 24 h) gespeichert.
4. Gratulation und Fanfare erscheinen.

Ist am Rechner „Bewegung reduzieren“ eingestellt, dreht sich das Rad nur kurz und es gibt kein Konfetti.

## Weitere Dokumente

- [PROJEKT.md](PROJEKT.md): der ursprüngliche Projektsteckbrief mit den Anforderungen
