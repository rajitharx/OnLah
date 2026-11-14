# Mobile to web parity

The web bus board (`apps/web`) is ahead of the mobile app. This file records the audit and the task list for closing the gap. The audit is a snapshot from 2026-11-09: when a value here (a cap, a radius, an interval) differs from the web source, the web source wins. Mobile release versions (1.1, 1.2, ...) are independent of the web version. Decisions made on 2026-11-09:

- Port every web feature, including those outside the original v1 scope. The scope was extended in `Docs/Claude/ONLAH_APP_GUIDE.md`.
- Keep the mobile dark palette. `src/shared/theme/colors.ts` does not change. "Similar" means the same layout, components, copy and behaviour, not the web's cream colours.
- Use TDD for logic (utils, hooks, stores, API client, poller). UI is checked by the design-rule test, typecheck and a manual run.
- One fresh branch per batch from `origin/main`, related changes committed together, `npm run check` green, one PR per batch. Every batch adds a release-notes entry in `src/features/release-notes/releases.ts`.

## What mobile has today

- Tabs: Home (favourites), Nearby, Search. Each tab stack ends in `ArrivalScreen`.
- Arrivals: 20 s poll, three ETAs per service, crowd badge, favourite toggle.
- Nearby: GPS permission flow, 500 m radius. Search: stops by code or name.
- Disruption banner on the Home tab only. Train alerts polled app-wide.
- Favourites: Zustand plus AsyncStorage, cap 10.
- Backend calls used: `bus-arrivals`, `bus-stops/nearby`, `bus-stops/search`, `train-alerts`.
- Tests cover pure utils and the design rules only. No hook, store or API tests.

## What the web has that mobile lacks

| Area | Web behaviour | Source in `apps/web/src` |
|---|---|---|
| Header | API status dot (`/health` every 10 s: good, slow over 1.5 s, down), version label | `app/AppHeader.tsx`, `shared/hooks/useApiStatus.ts` |
| Notices | Offline notice, stale-data notice, "waking up the server" after 3 s | `shared/components/OfflineNotice.tsx`, `StaleNotice.tsx` |
| Arrivals | Operator logo, direction groups, crowd-filled ETA tiles with bus type, crossed wheelchair icon, LAST chip, legend, advisories, Track link, Show in Maps | `features/arrivals/*` |
| Search | 250 ms debounce, abort, highlight, input validation, 20 result cap, retry states | `features/search/*`, `shared/utils/search.ts` |
| Nearby | 1 km radius, privacy caption, specific denied/unavailable/timeout messages | `features/nearby/*` |
| Saved | Saved buses (a service at a stop, cap 20) above saved stops (cap 10), near-limit captions | `features/saved-buses/*`, `features/favourites/*` |
| Service sheet | Operator names, deck types, per-direction route, hours, frequency | `features/services/*` |
| Route tracker | "N stops away" countdown, later buses, rail of stops with gaps | `features/route-tracker/*` |
| Release notes | Features, release history, roadmap | `features/release-notes/*` |
| Shared | Poller that pauses when hidden and never overlaps, server clock synced on every response, problem-details errors | `shared/services/poller.ts`, `serverClock.ts`, `onlahApi.ts` |

The backend already has `bus-services/{serviceNo}`, `route-tracker` and `/health`. This is mobile-only work.

## Tasks

### Phase 0 and 1: today (2026-11-09)

- Batch A: scope docs, this file, release-notes data and test.
- Batch B: API layer and types (`getHealth`, `getBusService`, `getRouteTracker`, problem-details errors, timeout and abort), shared poller, server clock synced in the API client.
- Batch C: limits and utils ported with tests (`limits`, search validation, `highlight`, `groupByDirection`, `sortByServiceNo`, `busAdvisories`, `arrivalsState`, `stopsAwayLabel`, `railModel`, `trackerLabels`).
- Batch D: shared components (`Freshness`, `ResyncButton`, `StaleNotice`, `OfflineNotice`, `EmptyState`, `StopCard`, `OperatorLogo`, `FindStopActions`, `BoardLegend`, icons, skeleton message), header with the API status dot, disruption banner in the app shell.

### Phase 2: 2026-11-10 09:30 SGT (scheduled)

6. Arrivals screen parity. 7. Search parity. 8. Nearby parity. 9. Saved tab (rename Home, default landing, captions, empty state).

### Phase 3: 2026-11-11 09:30 SGT (scheduled)

10. Saved buses. 11. Service details sheet. 12. Route tracker. 13. Navigation params and back handling. 14. Release notes screen.

### Phase 4: after review (not scheduled)

15. Accessibility and polish. Done in #76 (2026-11-14): shared `BackButton` at 44pt, disruption announced with `AccessibilityInfo`. Every other control already had a role and label. Not yet tried with a screen reader.
16. Fill any test gaps left by earlier batches. Done in #76: `haversine`, `disruptionStore` and the announcement rule. The persisted stores (favourites, saved buses) are not tested, because they use AsyncStorage and only delegate to tested utils; a React rendering test setup does not exist.
17. Manual QA on device and release. Open.

## Rules that still apply

No palette change, no third-party UI library, a feature folder per screen, stop codes are `String`, no LTA key in mobile, and the design-rule test (no inline styles, colour literals, spacing or `fontSize` literals, `TouchableOpacity`, `console.log` or `any`).
