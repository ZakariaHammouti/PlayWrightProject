# Glücksrad für Studierende

Ein Glücksrad, in das man die Namen von Studierenden einträgt und zufällig eine Person zieht.
Gebaut mit React, TypeScript und Vite.

## Funktionen

- Namen einzeln hinzufügen oder als Liste einfügen (ein Name pro Zeile)
- Rad drehen und zufällig eine Person ziehen, mit Gratulation, Konfetti und Fanfare
- Gezogene Personen sind 24 Stunden gesperrt. Die Sperre kann man manuell aufheben.
- Statistik pro Person: Anzahl der Ziehungen, letzte Ziehung, Status
- Alle Daten bleiben im localStorage des Browsers. Es gibt keinen Server und keine Benutzerkonten.

## Starten

```bash
cd gluecksrad
npm install
npm run dev
```

Der Projektsteckbrief steht in [PROJEKT.md](PROJEKT.md).
