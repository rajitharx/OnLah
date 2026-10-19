# OnLah Bus Board

The OnLah bus board website. It reads the OnLah backend and never calls LTA directly.

## Run it

Start the backend first (it listens on http://localhost:5050 in Development). Then:

```bash
cd apps/web
npm install
npm run dev
```

Open http://127.0.0.1:5173/. The backend allows this origin for CORS in Development.

To point at another backend, set `VITE_API_BASE_URL` (default `http://localhost:5050`).

## Test and build

```bash
npm test        # Vitest unit tests
npm run build   # type check and production build
```

## What it does

- **Routes**: each screen has a path (`/search`, `/nearby`, `/saved`, `/stop/01121`, `/stop/01121/bus/197`). Refresh, back and bookmarks keep the place. Vite serves the app for any path in dev. Cloudflare Pages uses `public/_redirects` to do the same in production.
- **Board**: stop name and road, then one row per service with three ETA tiles (minutes, crowd level, bus type, wheelchair access). Refreshes every 20 seconds. A failed refresh keeps the last known times and says so.
- **Search**: by stop code or road name. Backend limits apply: 2 to 50 characters, max 20 results.
- **Nearby**: uses the browser's location, within 1 km, nearest first. Nothing is shown until the visitor shares a location. A blocked or unavailable location says why, and offers Search.
- **Saved**: buses (max 20) and stops (max 10) kept in `localStorage`. Either list can be reordered. A first-time visitor lands on Search.
- **MRT disruption banner**: shown when the train-alert status is 1 (Disrupted). Refreshes every 2 minutes.

## Folder layout

```
src/
  main.tsx
  app/             App shell, tab bar, global styles
  features/
    arrivals/      Stop board, service rows, ETA tiles, refresh hook, state rules
    disruptions/   MRT banner and its refresh hook
    favourites/    Saved stops, storage rules, hook
    nearby/        Location-based stops and hook
    search/        Stop search and debounced hook
  shared/
    components/    Icons, crowd badge, stop card, empty state, freshness
    hooks/         useNow
    services/      Backend client (onlahApi.ts)
    theme/         Palette tokens (mirror the mobile app)
    utils/         Query checks, ETA, crowd and distance helpers
  types/           Response shapes (copied from the mobile app)
```

## Design notes

- Palette tokens are copied from `apps/mobile/src/shared/theme/colors.ts` into `src/shared/theme/colors.ts` and `:root` in `src/app/styles.css`. Keep them in sync.
- No third-party UI library. Icons are inline SVG.
- Light cream page, as before. Split-flap ETA tiles take the crowd colour.
- Two typefaces: Newsreader for headings and Space Mono for labels. Body text uses the system UI font.
- The home-screen icon and manifest are in `public/`. `apple-touch-icon.png` is a generated 180px PNG of `icon.svg`.
- Response shapes come from `apps/mobile/src/types/domain.ts` (copied, not imported). Enums arrive as integers because the backend uses default C# enum serialization.
- Pure rules (query checks, arrivals state, favourites storage, API client) live in plain `.ts` files and have unit tests. Views and hooks have no tests yet.

## Known gaps

- Saved stops store the name at the time they were saved. A renamed stop shows the old name until it is saved again.
- A stop opened from a bare code (for example `/stop/01121`) is found with a search for that code. The backend has no single-stop lookup, so this relies on exact code matches sorting first. A code with no exact match shows "not found".
