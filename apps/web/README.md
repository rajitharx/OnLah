# OnLah Bus Board (design sample)

A visual sample of the OnLah bus website. It uses made-up data, not live LTA data.
It is a design review, not the production site.

## Run it

```bash
cd apps/web
npm install
npm run dev
```

Then open http://127.0.0.1:5173/ . Resize the window or use a phone-width emulator to check the layout.

## What is in the sample

- **Board**: stop name and road, then one row per service with three ETA tiles (minutes, crowd level, bus type, wheelchair access).
- **Search**: by stop code or road name, max 20 results.
- **Nearby**: uses the browser's location, within 5 km, sorted by distance. Falls back to a sample location.
- **Saved**: favourites kept in `localStorage`, max 10.
- **MRT disruption banner**: shown when the train-alert status is 1 (Disrupted), as in `src/types/domain.ts`.
- **Freshness**: "Updated Ns ago" on the board, and a silent refresh every 20 seconds.

## Folder layout

Mirrors `apps/mobile/src` so features are easy to find:

```
src/
  main.tsx
  app/             App shell, tab bar, global styles
  features/
    arrivals/      Stop board, service rows, ETA tiles, refresh hook
    disruptions/   MRT banner
    favourites/    Saved stops and their hook
    nearby/        Location-based stops
    search/        Stop search
  shared/
    components/    Icons, crowd badge, stop card, empty state, freshness
    hooks/         useNow
    services/      Sample data (replace with backend calls)
    theme/         Palette tokens (mirror the mobile app)
    utils/         ETA, crowd and distance helpers
  types/           Response shapes (copied from the mobile app)
```

## Design notes

- Palette tokens are copied from `apps/mobile/src/shared/theme/colors.ts` into `src/theme/colors.ts` and `:root` in `src/styles.css`. Keep them in sync.
- No third-party UI library. Icons are inline SVG.
- Dark-first, with split-flap style ETA tiles.
- Response shapes come from `apps/mobile/src/types/domain.ts` (copied, not imported).

## Not done yet

- No backend calls. Data comes from `src/data/sample.ts`.
- Stop codes are strings everywhere.
