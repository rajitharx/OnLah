# Changelog

The version is `major.minor`, set in `package.json` and shown in the header as "Beta <version>".
Every commit raises the minor number by one through the pre-commit hook, so this file lists only the versions shown on the /notes page: milestones and notable changes.

## 1.67

**Clearer stale and alert notices.** Three small fixes to the failed-refresh messages.

- The Route Tracker no longer shows the data age twice. When a refresh fails, the "Couldn't refresh. Showing data from Ns ago." notice carries the age and the header chip is hidden. Old data without a failed refresh, such as a hidden tab, still shows the "Stale" chip.
- If a service alerts refresh fails after a good result, the page shows "Couldn't refresh service alerts." with "Last checked Ns ago", also when that result had no alerts. The notice is neutral and clears on the next success. The disruption card drops its own "Checked" line while this shows.
- The alert notices now go into a status region that is always on the page, so screen readers announce them when they appear. The age is outside the region, so the announced text does not change every second.

## 1.54

**Build and release labels.** The top of `/notes` read a single "Beta 1.53" version above a latest release of 1.51, which looked inconsistent. It now reads "This build: Beta <build>. Release notes cover up to <newest release>." and says that the build number rises with every change while the history lists milestones.

- The newest release version comes from `releases[0]`, not from fixed text.
- A test checks that the build version is not older than the newest release, comparing major and minor as numbers.
- The roadmap guard test now checks that it parses every open checkbox in `Docs/onlah-ui-review.md`.

## 1.51

**Release notes and roadmap.** A page at `/notes` (also `/about`) lists the app's features, a release history and a Shipped / Next / Later roadmap.

- It is reachable by URL only. No tab, button or header link points to it, and no tab shows as active on it.
- The content is in `src/features/release-notes/releases.ts`. A test checks that its newest version matches the top entry here.
- Each history item is tagged Feature, Improvement or Bug fix. The roadmap's Next and Later lists are the open items from `Docs/onlah-ui-review.md`.

## 1.45

**Service alerts unavailable.** When the MRT alerts fail to load, the page now says "Service alerts unavailable" instead of showing nothing, which used to look the same as "no disruptions".

- The notice is neutral, without the red used for real disruptions. It is announced to screen readers as a status.
- A failed refresh after alerts have loaded keeps the last result, as before.
- With no alerts and no error the page still shows nothing.

## 1.6

**Stale arrivals warning.** When a refresh fails, the last times stay on screen and a notice says "Couldn't refresh. Showing data from Ns ago." with a Try again button. It clears on the next successful refresh.

- One shared notice for the stop board, saved stops and the Route Tracker. It uses the amber border, not a red one.
- Try again reuses the existing manual refresh.

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
