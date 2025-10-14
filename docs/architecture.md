# 🧱 Systemarchitektur von EndlosLabyrinth

## Überblick
Das Projekt basiert auf drei Modulen:
1. KeyboardJS – Eingabeverarbeitung
2. MazeGenerator – Weltgenerierung
3. LLM-Modul (Gemma 3 270M IT über LM Studio) – KI-Assistenz

## Datenfluss
Keyboard-Ereignis → Game State → LLM → Antwort (Hinweis) → UI

## Architekturprinzipien
- Entkopplung der Module
- Asynchronität und Streaming
- JSON-basierte Kommunikation
- Erweiterbare Struktur (z. B. 3D, Multiplayer)
