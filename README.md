# Jira Clone

Lokalny klon Jiry, bez użytkowników i bez serwera. Dane są zapisywane w przeglądarce (`localStorage`).

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja działa pod adresem http://localhost:5173.

## Funkcje

- Projekty z kluczem (np. `FAV`), od którego zależą numery zadań (`FAV-1`, `FAV-2`…)
- Tablica Kanban z przeciąganiem kart: Do zrobienia → W trakcie → Do przeglądu → Gotowe
- Szczegóły zadania: tytuł, opis, typ, priorytet, status, etykiety, termin, komentarze, historia zmian
- Backlog z sortowaniem, wyszukiwarką i filtrami (typ, priorytet, etykieta)
- Menu „Dane”: eksport i import JSON, przykładowe dane, czyszczenie

## Technologie

React 19 + TypeScript + Vite, `zustand` (stan i zapis do `localStorage`), `@dnd-kit` (przeciąganie), `react-router`.

## Skrypty

- `npm run dev` – serwer deweloperski
- `npm run build` – sprawdzenie typów i build produkcyjny
- `npm run format` – formatowanie kodu (Prettier)
