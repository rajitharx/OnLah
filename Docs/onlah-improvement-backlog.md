# OnLah improvement backlog

Written 16 Nov 2026, after the mobile web-parity work (tasks 1 to 16) was merged. `[ ]` means still open. This sits beside `onlah-bug-backlog.md`, which holds small known bugs. This file holds larger improvements. Nothing here is started.

## 1. Finish the parity work (needs a device or a browser)

- [ ] **Task 17: manual QA and release.** Run VoiceOver and TalkBack over the disruption announcement, the Back and Close buttons and the search field, then a release pass. See `apps/mobile/WEB_PARITY.md`.
- [ ] **Bug backlog 6, 7, 8, 9, 12.** Nearby with real GPS, the no-service state at night, placeholder contrast and the header dot, `/notes` at 375px, and a visual check of the alert cards. Details are in `onlah-bug-backlog.md`.

## 2. Turn "review only" rules into checks

The rules table in `CLAUDE.md` lists these as enforced by "Nothing". Each is a small PR.

- [x] **Bus Arrival uses the LTA v3 endpoint.** Done: a test on the request path in `LtaBusClientTests.cs`.
- [x] **No LTA AccountKey in mobile.** Done in `apps/mobile/__tests__/hardRules.test.ts`.
- [x] **Bus stop codes are `String`.** Done for mobile in `hardRules.test.ts` and for the backend in `StopCodeTypeRuleTests.cs`, both by name (`*StopCode*`). Not done: a field with a different name.
- [x] **Palette unchanged.** Done in `hardRules.test.ts`.

The `CLAUDE.md` table rows are updated. Still review only: no third-party UI library, and a new screen needs a feature folder.

## 3. Test depth

- [x] **React rendering tests for mobile.** Done: Jest with `jest-expo` and React Native Testing Library, in `apps/mobile/__render__`, run by `npm run test:render` and by `npm run check`. Covers `BackButton` and the `DisruptionBanner` announcement. The screens (Arrivals, Search, Nearby, Saved, tracker, sheet) still have no render tests, so add them one at a time as they change.
- [x] **Persisted stores.** Done in `__render__/persistedStores.test.ts`, using the AsyncStorage mock.
- [ ] **Contract check against the backend.** One end-to-end test that the mobile API client matches the real response shapes.

## 4. Release and operations

- [ ] **Mobile release pipeline.** `apps/mobile/app.json` is version 1.0.0 while the in-app release notes are at 1.12. Decide how the build version follows the notes, then set up EAS builds and TestFlight.
- [x] **Web version hook.** Done: `.githooks/pre-commit` bumps only when a commit stages something under `apps/web`, with a test in `apps/web/scripts/preCommitHook.test.mjs`.
- [x] **CI path filtering.** Checked on 16 Nov 2026: there is no path filter, and the `backend`, `web` and `mobile` jobs ran in full on the docs-only PRs. A filter would be a risk, because the web tests read `Docs/`, `CHANGELOG.md` and `.githooks/`. Done instead: CI also runs on pushes to `main`, a newer push cancels the older run on the same PR, jobs have a 15 minute timeout, and the token is read-only.
- [ ] **Required checks.** Branch protection is not available on this plan (the API returns 403), so a PR can still be merged with a red check. Needs GitHub Pro or a public repository, or a habit of looking before merging.
- [ ] **`keep-alive.yml`.** Check it still does its job. The "waking up the server" notice suggests cold starts still happen.

## 5. Product ideas outside the v1 scope

`Docs/Claude/ONLAH_APP_GUIDE.md` says "do not build" for these. Each needs an explicit scope decision first, as was done for web parity on 2026-11-09.

- Live bus position on a map.
- ETA reliability badges.
- Android store release (deferred to v2).
- Server-synced favourites, which need accounts.

## Suggested order

Section 2 first (small, no device), then the rendering-test setup from section 3, then section 4. Sections 1 and 5 depend on you.
