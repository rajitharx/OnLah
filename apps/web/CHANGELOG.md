# Changelog

The version is `major.minor`, set in `package.json` and shown in the header as "Beta <version>".
Every commit raises the minor number by one through the pre-commit hook, so only milestone versions are listed here.

## 1.1

**Route Tracker.** Follow one bus service at one stop.

- A "N stops away" countdown for the next bus, with its ETA and crowd level.
- A vertical rail of the service's stops in order. It marks the bus and the user's stop, mutes stops the bus has passed, and folds long stretches into "+N stops".
- A strip for the second and third buses.
- A Track link on every service row. The page is also a direct link, `/track/:busStopCode/:serviceNo`.
- States for loading, live, scheduled, no estimate, not in operation, a failed refresh (stale), and an unknown stop or service.
- Backend: `GET /api/v1/route-tracker`. It reads live arrivals from LTA on every call and works out the stops-away count from the bus's GPS position.
- No map. The rail is a list.

## 0.1 to 0.4

Review fixes and polish, in order.

- Natural service sort, search status, URL routes, bottom tab bar, and a Saved tab with re-sync.
- Plain deck labels, equal tiles, and the Beta version label.
- Automatic version bump on commit, and a wordmark link to the home page.
