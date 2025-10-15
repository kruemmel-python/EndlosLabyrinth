# 🌀 EndlosLabyrinth
**Ein experimentelles Browser-Spiel über Tastaturinteraktion, prozedurale Labyrinthe und lokale KI-Integration.**

## Konzept
EndlosLabyrinth kombiniert drei zentrale Technologien:
1. KeyboardJS – zuverlässige, plattformübergreifende Tastatureingabe.
2. Rekursiver Backtracking-Algorithmus – generiert perfekte Labyrinthe beliebiger Größe.
3. Gemma 3 270M IT über LM Studio – lokal laufendes Sprachmodell zur dynamischen, kontextsensitiven Unterstützung.

## Merkmale
- Tastatursteuerung (Achsen, Mehrfachbindung, Layouts)
- Prozedurale Labyrinthe
- KI-Unterstützung (lokal, offline, reaktiv)
- Modular, datenschutzfreundlich

## Quickstart
```bash
git clone https://github.com/kruemmel-python/EndlosLabyrinth.git
cd EndlosLabyrinth
npm install
npm run dev
```

> Voraussetzung: Node.js ≥ 18, LM Studio mit aktivem Endpoint (Port 1234) sowie Zugriff auf das npm-Registry.

## Entwicklungs-Workflow
- `npm run dev` startet die neue React/Vite-Entwicklungsumgebung mit Hot Module Reloading.
- `npm run build` erstellt einen optimierten Produktionsbuild in `dist/`.
- `npm run preview` dient zum lokalen Testen des Produktionsbuilds.

Die bestehende Spielelogik wird beim Start der React-App automatisch nachgeladen und initialisiert das Labyrinth auf dem gerenderten DOM.

## Lizenz
Dieses Projekt steht unter der MIT-Lizenz (siehe LICENSE).
