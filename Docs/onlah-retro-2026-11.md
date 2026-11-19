# OnLah retro, 17 Oct to 18 Nov 2026

Written 19 Nov 2026, after PR #86. It covers the web bus board, the mobile web-parity work and the checks added around them. The evidence is the git history (349 commits, PRs #1 to #86) and the two backlog files. It is not a record of what anyone felt at the time, so the "what went wrong" section only lists what the history shows.

## The shape of the month

- Backend v1 landed in June. Almost everything else happened between 17 Oct and 18 Nov.
- Commit types: 92 `fix`, 52 `feat`, 38 `test`, 30 `docs`, 12 `chore`, 4 `ci`, 4 `refactor`. There were nearly twice as many fixes as features.
- Busiest days: 24 Oct (39 commits), 6 Nov (36), 31 Oct (28) and 4 Nov (26). On 6 Nov five or six fix branches were open at once.
- Phases: web board (17 to 24 Oct), QA and hardening (24 Oct to 8 Nov), mobile parity in 16 tasks (9 to 14 Nov), turning rules into checks (16 to 18 Nov).

## What went well

1. **One branch and one PR per task.** 86 PRs, each small and named for one change. The history reads as a list of decisions.
2. **Review notes turned into code.** The rules table in `CLAUDE.md` started as "review only". By 18 Nov the palette, the LTA AccountKey, string stop codes and the v3 Bus Arrival path each have a test. The table also states what each check cannot catch (for example, the stop-code scan goes by name).
3. **The mobile/backend contract test (#84).** `MobileContractTests` records real responses as fixtures and `contract.test.ts` type-checks them against the mobile types. This closes the gap where the two sides drift apart without anyone noticing.
4. **Scope decisions were written down.** Web parity was made explicitly in scope on 9 Nov, and the backlog lists what stays out (maps, accounts, Android) instead of letting it creep in.
5. **Backlogs kept honest.** Both backlog files use checkboxes, link PR numbers, and say "needs a device" where nothing was verified. Item 5 in the bug backlog was recorded as "not a bug" and the reason was kept.
6. **Bugs that came from real data got fixed at the source.** Examples: lowercase bus services, destructive syncs refused, one route per direction (#57, #58), and a malformed percent escape that crashed Home.
7. **Accessibility was treated as a feature.** Labels on icon-only controls, 44pt tap targets, live regions and announcing a disruption only once.
8. **Checked before assuming.** The CI path-filter idea was tested on 16 Nov, found risky because web tests read `Docs/`, and replaced with concurrency and timeouts.

## What went wrong

1. **Fixes outnumbered features.** Many `fix` commits are follow-ups to a fix from the same day (for example the Back button, offline notice and disruption announcement went through about six commits on 14 Nov). Each was found in review instead of before the PR was opened.
2. **Parallel branches fought each other.** 20 "Merge origin/main" commits, and on 6 Nov the same three branches were merged into each other repeatedly. This is conflict-resolution time with no product value.
3. **The web version rule was fragile.** The pre-commit hook that bumps the version needed fixes on 21 Oct, 31 Oct, and again in #81 (16 Nov). The merge-time field in `releases.ts` needed hand-filling PRs (#39, #48, #61 and a chore on 7 Nov) because nothing detected a stale `shipped: null`.
4. **A design reversal cost a PR.** Colours changed and were restored on 19 Oct (#7). Dark mode, crowd bars and live dots were also tried and reverted. The "do not change the palette" rule only became a test on 16 Nov, four weeks later.
5. **Rules lived in review for weeks.** Four hard rules were "nothing enforces this" until #79. They held up in practice, but only because review caught slips.
6. **Parts of the app were never seen by a person.** Open items: real GPS Nearby, night-time no-service state, `/notes` at 375px, alert card layout, VoiceOver and TalkBack (task 17). Tests cannot answer these.
7. **Checks are advisory.** Branch protection is not available on this plan, so a red CI run does not block a merge.
8. **Mobile release is undefined.** `app.json` says 1.0.0 while in-app release notes say 1.12. There is no EAS or TestFlight pipeline.
9. **Docs drifted.** The bug backlog notes a QA list that says #45 is fixed while the UI list says open. The folder is tracked by git as `Docs/` but is named `docs` on this machine (a macOS case-insensitive mismatch), which can confuse tooling on a case-sensitive system such as Linux CI.
10. **Cold starts remain.** The "waking up the server" notice is a symptom, and `keep-alive.yml` has not been checked.

## What we can do

| # | Action | Why | Size |
|---|---|---|---|
| 1 | Do a short self-review against the `/ui` checklist and run `npm run check` before opening a PR | Cuts the same-day follow-up fixes (went wrong 1) | Habit |
| 2 | Stack dependent branches in order and merge the base first, or batch related fixes into one PR | Cuts merge-from-main noise (went wrong 2) | Habit |
| 3 | Add a test that fails on `shipped: null` for any merged release | Removes the hand-filled merge-time chores (went wrong 3) | Small |
| 4 | Run the manual QA list on a device: VoiceOver, TalkBack, GPS, night state, 375px | Only way to close the unverified items (went wrong 6) | Needs the owner |
| 5 | Decide the mobile version scheme, then set up EAS and TestFlight | Unblocks a release (went wrong 8) | Medium |
| 6 | Look at CI before every merge until required checks are possible (GitHub Pro or a public repo) | Closes the advisory-check gap (went wrong 7) | Habit |
| 7 | Add render tests for each mobile screen when that screen next changes | Screens have no render tests yet | Small each |
| 8 | Rename the local `docs` folder to match `Docs/` in git, and reconcile the QA and UI lists | Stops doc drift (went wrong 9) | Small |
| 9 | Check `keep-alive.yml` against the live server's cold-start behaviour | Went wrong 10 | Small |
| 10 | For any future design reversal, ask first whether a test or the app guide should record it | Avoids repeating the dark mode and colour round trips | Habit |

## Keep doing

- One branch from fresh `origin/main` per task.
- Turning a repeated review comment into a check, and stating the check's limits in the table.
- Writing "not verified" in the backlog when no device was available.
