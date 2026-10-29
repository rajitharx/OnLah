# Changelog

The version is `major.minor`, set in `package.json` and shown in the header as "Beta <version>".
Every commit raises the minor number by one through the pre-commit hook, so only milestone versions are listed here.

## 1.45

**Service alerts unavailable.** When the MRT alerts fail to load, the page now says "Service alerts unavailable" instead of showing nothing, which used to look the same as "no disruptions".

- The notice is neutral, without the red used for real disruptions. It is announced to screen readers as a status.
- A failed refresh after alerts have loaded keeps the last result, as before.
- With no alerts and no error the page still shows nothing.

## 1.5

**Last bus.** The ETA tile for a service's last bus of the night carries a "LAST" tag with a slowly pulsing dot, on the stop board and on saved buses. Screen readers hear "last bus".

- LTA sends no last-bus flag, so the backend matches each ETA against the published last-bus time at that stop (5 minutes before to 30 minutes after). It is an estimate, not an LTA signal.
- Only the latest matching bus of a service is tagged.
- With reduced motion the dot does not pulse.

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
