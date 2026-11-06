# Projektsteckbrief: Glücksrad für Studierende

## 1. Ziel / Idee
Ein eigenes Glücksrad, in das man die Namen von Studierenden einträgt und dann zufällig eine Person zieht.

## 2. Zielgruppe / Nutzer
Siehe Punkt 3: Es gibt keine Anmeldung. Wer die Seite öffnet, kann sie benutzen.

## 3. Benutzerkonten
Werden nicht gebraucht.

## 4. Rollen & Rechte
Werden nicht gebraucht.

## 5. Funktionen (Must-have)
- Namen eintragen und verwalten (die Namen werden später eingetragen):
  - als Liste einfügen (ein Name pro Zeile, z. B. aus Excel kopiert)
  - einzeln über Eingabefeld und Button hinzufügen
  - einzelne Namen löschen
- Rad drehen, eine Person wird zufällig gezogen (nur aus den nicht gesperrten Personen)
- Gezogene Person anzeigen
- Statistik pro Person:
  - Anzahl der Ziehungen
  - Datum und Uhrzeit der letzten Ziehung
  - Status: verfügbar oder gesperrt (mit Restzeit der Sperre)

## 6. Verhalten nach dem Ziehen
- Die gezogene Person wird für **24 Stunden gesperrt** und ist danach automatisch wieder im Rad.
- Eine Sperre kann **manuell aufgehoben** werden.
- Sind **alle Personen gesperrt**, lässt sich das Rad nicht drehen und es erscheint ein Hinweis.

## 7. Datenspeicherung
Im **localStorage** des Browsers: Namen, Statistik und Sperrzeitpunkte. Es gibt keinen Server und keine Datenbank.

## 8. Technik
- React mit **TypeScript**
- Build-Tool: **Vite**

## 9. Tests
Vorerst **keine Playwright-Tests**.

## 10. Design / Aussehen
Keine besonderen Wünsche: schlichtes, übersichtliches Design mit farbigen Segmenten und kurzer Dreh-Animation.
