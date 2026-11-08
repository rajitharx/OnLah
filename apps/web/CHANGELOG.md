# Changelog

The version is `major.minor`, set in `package.json` and shown in the header as "Beta <version>".
Every commit raises the minor number by one through the pre-commit hook, so this file lists only the versions shown on the /notes page: milestones and notable changes.

Entries are ordered by when their pull request merged into main, newest first, not by version number or pull request number: the minor number does not follow shipping order, and a lower-numbered pull request can merge later. Each heading ends with the number of the pull request that shipped it, such as `(#34)`, as a reference. The merge time is recorded as `shipped` in `src/features/release-notes/releases.ts`. Work whose pull request has not merged yet sits at the top, and early entries from before the pull request history have no number and stay at the bottom. A test checks this order here and in `releases.ts`.

## 1.107 (#61)

**Release dates filled in.** The release notes page shows the merge time of PRs #49, #52, #53, #57, #58, #59 and #60.

## 1.106 (#60)

**Stylesheet tidy-up.** Removed CSS rules that were repeated or always overridden (a duplicate colour on the wordmark, the 380px block, repeated tab bar and stop road rules, a repeated focus ring) and merged the two phone-width blocks. No visible change.

## 1.105 (#59)

**Safer edges and narrower-screen layout.**

- The page extends under the notch and home bar (`viewport-fit=cover`), with the top and side insets kept clear, so the bottom safe-area insets now apply: the page clears the tab bar by 96px plus the inset, and the bus popup has the inset in its bottom padding. Its height uses the visible screen (`dvh`).
- On desktop the bus popup is a centred panel, at most 560px wide.
- At 380px and narrower, the Save stop button wraps under the stop name, long names break only when a word does not fit, and the saved-stop "Open board ›" cue is hidden.
- The stop code is plain text everywhere (it was a bordered chip in lists and saved cards).

## 1.103 (#58)

**Each direction is its own row, and Track follows it.** LTA lists a bus such as 136 once per direction at a stop. The board gave both rows both routes, so one direction always showed empty tiles, and Track always opened the first direction.

- Each row now shows only the route its buses are heading on, so there are no more empty tiles for the other direction.
- Track opens the direction of the row you tapped. The link is `/track/66271/136/to/11111`, and the API takes an optional `destinationCode`. Saved buses still track the first direction.

## 1.102 (#57)

**Each direction of a bus shows its own buses.** A service that stops at a stop in both directions, such as 136 at 66271, listed both routes above one row of tiles, so you could not tell which bus was going where.

- The backend now sends the stop each bus is heading to (`destinationCode` on every bus) and on each route. The change only adds fields, so the API stays 1.x.
- When every bus can be matched to a direction, the board shows one route line with its own three tiles per direction. A direction with no bus due shows empty tiles. If any bus cannot be matched, the board keeps the combined layout.

## 1.101 (#53)

**No page jump while loading, and Saved buses match the board.**

- The board and a stop opened from a link show grey placeholders in the shape of a header and three service rows while the times load, instead of a small caption (board) or the dashed "not found" box (stop link). The page no longer jumps when the times arrive. "Waking up the server…" still shows if the first load is slow.
- A saved bus on the Saved tab now shows the same row as on the board: the origin to destination line, the Track link, and the three tiles. A bus with nothing due shows empty tiles instead of "No buses due right now."

## 1.100 (#52)

**Readable errors and a steadier Track link.** Error text and the MRT banner title are ink on the page instead of red, which failed contrast on the cream page and white cards.

- Error messages are dark ink with a red bar on the left, so they are readable but still stand out. The "MRT disruption" banner title is ink, and its warning icon stays red.
- On a service row the Track link sits at the right edge next to the star. Before, both had an automatic margin, so the free space was split and Track floated mid-row.

## 1.95 (#49)

**Easier-to-read arrival times.** The minutes on each ETA tile were the smallest bold text on the board.

- The minutes are larger, and "min" and the footer under them are at least 11px, on every tile alike.
- The "No bus" tile text is brighter, so it reads against the dark tile.

## 1.93 (#47)

**Steadier live refresh.** Six fixes to how the board, the Saved tab, the alerts banner and the Route Tracker refresh.

- A stop never has two arrival requests running at once. The 20-second timer, the Refresh button and Re-sync skip a stop whose last request has not finished, so a slow response cannot replace newer times. An arrivals response older than the data on screen is also ignored. Re-sync requests are cancelled when the Saved tab goes away.
- Bus arrivals, saved buses and service alerts pause while the tab is hidden and refresh as soon as it is visible again, as the Route Tracker already did.
- The Route Tracker stops refreshing once the service is not found at the stop.
- Opening another stop shows no times from the previous stop, not even for one frame, while the new ones load.
- The "Updated Ns ago" chips, the stale notices, the ETA tiles and the Route Tracker keep their own one-second clock, so the rest of the page no longer re-renders every second.
- Saved buses and favourite stops changed in another tab appear here straight away, and a save in this tab starts from what is stored, so two tabs no longer overwrite each other's saves.

## 1.92 (#42)

**Retry after a failed lookup.** Three screens could fail and then give no way to try again.

- Nearby: tapping "Use my location" again, or "Try again" under the failure message, fetches again. Before, the same coordinates never refetched.
- Search: "Try again" searches the same text again. A network error, or any failure while the browser is offline, now reads "Search is unavailable right now. Try again." instead of "Try different words."
- A stop opened from a link that fails to load now has a "Try again" button.

## 1.89 (#43)

**Announcements and focus.** Screen changes, search results and failed refreshes are now announced to screen readers, and focus follows the screen.

- After a screen change (not the first load), focus moves to the new screen's heading and the tab title names the screen, such as "Stop 01012 · Hotel Grand Pacific · OnLah". Opening or closing a service sheet on a board does not count as a new screen. Not tested with a screen reader.
- Search has one status region that is always on the page: "Searching…", then the result count, or the no-match text. The no-match text is hidden visually there because the empty state already shows it.
- In the Route Tracker, "+N stops" is keyed by the first stop's sequence, so an opened section stays open as the bus moves. Focus moves to the first revealed stop. The button is removed once opened, so `aria-expanded` is only ever rendered as false.
- On Saved, each card's failed-refresh notice is a polite status. One alert appears above the cards when every saved stop failed to refresh. The board and the tracker keep their alert.

## 1.87 (#41)

**Bus details sheet: Back and keyboard focus.** Two fixes to the sheet that opens from a service number on the board.

- Closing a sheet that was opened from the board steps back one history entry instead of replacing it, so Back and the on-screen back arrow leave the board rather than landing on the same board again. A sheet opened from a direct link or from the Saved tab still closes in place.
- The sheet moves focus to its Close button when it opens, keeps Tab inside it, and returns focus to the control that opened it when it closes. Its Escape listener is no longer re-added on every render.

## 1.73 (#38)

**Release history by merge time.** The list is ordered newest merged first. Each release records the time its pull request merged, and the pull request number is shown as a reference.

- Pull request 33 merged a few minutes after 34, so 1.45 sits above 1.6.
- A test checks that the merge times descend, that this file lists the same pull requests in the same order as `releases.ts`, and that only unmerged work at the top and early history at the end lack a merge time.
- The guard that keeps node code out of the browser bundle starts at `version.ts` and follows quoted `import`, `export ... from` and dynamic `import()` specifiers, resolving relative ones, but only to files in `src/shared` and `scripts`. It checks only the files reachable that way; a file that `version.ts` does not import is not checked, even under `src/shared`. It fails on a `node:` specifier, on a bare built-in from a hardcoded list (`fs`, `path`, `url`, `os`, `child_process`, `crypto`, `util`, `stream`, `http`, `https`, `net`, `zlib`, `buffer`, `events`, `assert`, `module`, `worker_threads`, `readline`, `tty`, `vm`, and their subpaths such as `fs/promises`), and on the text `process.`, so a bare `process` is not flagged. It does not follow computed specifiers, `require`, or imports that resolve to folders other than `src/shared` and `scripts`, and it does not know built-ins outside that list.

## 1.67 (#37)

**Clearer stale and alert notices.** Three small fixes to the failed-refresh messages.

- The Route Tracker no longer shows the data age twice. When a refresh fails, the "Couldn't refresh. Showing data from Ns ago." notice carries the age and the header chip is hidden. Old data without a failed refresh, such as a hidden tab, still shows the "Stale" chip.
- If a service alerts refresh fails after a good result, the page shows "Couldn't refresh service alerts." with "Last checked Ns ago", also when that result had no alerts. The notice is neutral and clears on the next success. The disruption card drops its own "Checked" line while this shows.
- The "unavailable" and "couldn't refresh" notices now sit in a status region that is always on the page. The disruption card's own status region appears together with the alerts, so announcing a newly appearing disruption is not guaranteed. This is not tested with a screen reader. The ticking age is kept outside every status region.

## 1.54 (#36)

**Build and release labels.** The top of `/notes` read a single "Beta 1.53" version above a latest release of 1.51, which looked inconsistent. It now reads "This build: Beta <build>. Release notes cover up to <newest release>." and says that the build number rises with every change while the history lists milestones.

- The newest release version comes from `releases[0]`, not from fixed text.
- A test checks that the build version is not older than the newest release, comparing major and minor as numbers.
- The roadmap guard test now checks that it parses every open checkbox in `Docs/onlah-ui-review.md`.

## 1.51 (#35)

**Release notes and roadmap.** A page at `/notes` (also `/about`) lists the app's features, a release history and a Shipped / Next / Later roadmap.

- It is reachable by URL only. No tab, button or header link points to it, and no tab shows as active on it.
- The content is in `src/features/release-notes/releases.ts`. A test checks that its newest version matches the top entry here.
- Each history item is tagged Feature, Improvement or Bug fix. The roadmap's Next and Later lists are the open items from `Docs/onlah-ui-review.md`.

## 1.45 (#33)

**Service alerts unavailable.** When the MRT alerts fail to load, the page now says "Service alerts unavailable" instead of showing nothing, which used to look the same as "no disruptions".

- The notice is neutral, without the red used for real disruptions. It is announced to screen readers as a status.
- A failed refresh after alerts have loaded keeps the last result, as before.
- With no alerts and no error the page still shows nothing.

## 1.6 (#34)

**Stale arrivals warning.** When a refresh fails, the last times stay on screen and a notice says "Couldn't refresh. Showing data from Ns ago." with a Try again button. It clears on the next successful refresh.

- One shared notice for the stop board, saved stops and the Route Tracker. It uses the amber border, not a red one.
- Try again reuses the existing manual refresh.

## 1.5 (#16)

**Last bus.** The ETA tile for a service's last bus of the night carries a "LAST" tag with a slowly pulsing dot, on the stop board and on saved buses. Screen readers hear "last bus".

- LTA sends no last-bus flag, so the backend matches each ETA against the published last-bus time at that stop (5 minutes before to 30 minutes after). It is an estimate, not an LTA signal.
- Only the latest matching bus of a service is tagged.
- With reduced motion the dot does not pulse.

## 1.1 (#14)

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
