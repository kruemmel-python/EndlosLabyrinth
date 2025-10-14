# Endlos Labyrinth

Endlos Labyrinth ist ein experimentelles 2D-Actionspiel, das vollständig im Browser läuft. Du navigierst durch ein prozedural wirkendes Labyrinth, weichst patrouillierenden NPCs aus und sammelst verschiedene Power-ups ein. Die Benutzeroberfläche kombiniert einen Startbildschirm mit Branding, einen Spielmodus mit HUD sowie einen Lehrmodus zum Üben der Steuerung.

## Features

- **Startmenü mit Branding:** Ein von Retro-Arcades inspiriertes Menü mit Logo, Tagline und Buttons für Spielstart, Einstellungen und Lehrmodus.
- **Spielmechaniken:** Sprint-, Verlangsamungs- und Sprung-Items beeinflussen deine Bewegung, sobald sie eingesammelt wurden.
- **NPC-Verhalten:** Gegnerische Patrouillen bewegen sich entlang festgelegter Routen und interagieren physikalisch mittels Box2D.
- **HUD & Feedback:** Die Oberfläche informiert über aktive Status-Effekte und blendet Toast-Nachrichten ein, wenn Items eingesammelt oder Effekte aktiv werden.
- **Lehrmodus:** Ein stressfreier Modus, in dem du Items ausprobieren kannst, ohne von NPCs verfolgt zu werden.

## Voraussetzungen

Um das Projekt lokal auszuführen, benötigst du lediglich einen aktuellen Webbrowser (Chrome, Firefox, Edge, Safari o.ä.). Für lokale Entwicklungs- oder Testzwecke empfiehlt es sich, einen einfachen HTTP-Server zu verwenden, damit statische Assets korrekt geladen werden.

## Installation & lokales Setup

1. **Repository klonen**
   ```bash
   git clone https://github.com/<DEIN-NAME>/EndlosLabyrinth.git
   cd EndlosLabyrinth
   ```
2. **Lokalen Server starten** – wähle eine der folgenden Optionen:
   - Python 3:
     ```bash
     python3 -m http.server 8000
     ```
   - Node.js (npx):
     ```bash
     npx serve .
     ```
   - VS Code Live Server Extension oder ein anderer Entwicklungsserver deiner Wahl.
3. **Spiel öffnen**
   - Rufe im Browser `http://localhost:8000` (bzw. den Port deines Servers) auf.
   - Das Startmenü erscheint. Klicke auf **„Spiel starten“**, um das Gameplay zu erleben, oder erkunde **„Einstellungen“** bzw. **„Lehrmodus“** für zusätzliche Informationen.

## Steuerung

- `WASD` – Bewegung des Spielers
- `Umschalt` – Sprinten (nach dem Einsammeln des Sprint-Items)
- `Leertaste` – Springen (nach dem Einsammeln des Sprung-Items)

## Projektstruktur

```
EndlosLabyrinth/
├── assets/
│   └── js/
│       ├── entities.js   # Definition von Spieler, NPCs und Items
│       └── game.js       # Spiel-Loop, Physik-Setup, HUD & Eingaben
├── index.html            # Startmenü und Canvas-Einbettung
├── style.css             # Retro-Styling für Menü, HUD und Toasts
└── README.md             # Dieses Dokument
```

## Weiterentwicklung

- Ergänze Audioeffekte für Item-Pickups und UI-Feedback.
- Implementiere ein Punktezählersystem oder Level-Progression.
- Füge zusätzliche Gegnertypen oder zufällige Labyrinth-Layouts hinzu.

## Lizenz

Das Projekt steht unter der Lizenz aus der Datei [`LICENSE`](LICENSE).
