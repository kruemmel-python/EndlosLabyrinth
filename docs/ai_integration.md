# 🤖 Lokale KI-Integration (Gemma 3 270M IT über LM Studio)

## Architektur
Client: Browser/TypeScript
Server: LM Studio (OpenAI-kompatibel)
Modell: Gemma 3 270M IT (≈270 MB, CPU-tauglich)

## Beispiel
```json
{
  "model": "gemma-3-270m-it",
  "messages": [
    {"role": "system", "content": "Du bist der Erzähler."},
    {"role": "user", "content": "{\"phase\":\"level_end\",\"coins\":6}"}
  ]
}
```

Antwort:
```json
{
  "hints": [
    "Glückwunsch! Du hast alle 6 Münzen gefunden.",
    "Bereit für das nächste Level!"
  ]
}
```
