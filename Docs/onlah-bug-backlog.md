# OnLah bug backlog

Small, clear bugs found while reviewing PRs #33 to #36. Written 31 Oct 2026. `[ ]` means still open.

## Worth doing next

- [x] 1. **Route Tracker shows the data age twice.** *Done in #37.* Its own "Stale" chip sits next to the new "Couldn't refresh" notice. The fix is one condition, `stale && !state.failed`, plus a test. Small.
- [x] 2. **Silent failure after an empty alerts result.** *Done in #37.* If the first alerts fetch returns no alerts and a later refresh fails, nothing shows, which is the "silence reads as all clear" problem. The fix is a small change to the alerts state, so a failed refresh after a good result also flags as stale. Small to medium.
- [x] 3. **Screen readers may miss the "Service alerts unavailable" notice.** *Done in #37 for the new notices. The MRT disruption card's own region still mounts with its content, so announcing a new disruption is not guaranteed and nothing is tested with a screen reader.* It is mounted together with its `role="status"` region. The fix is an always-mounted live region. Small.
- [x] 4. **Version guard misses some imports.** *Done in #38, with documented limits (only files reachable from version.ts are checked).* The browser-safety test only follows single-quoted imports. Matching double quotes and bare `import 'x'` closes the gap. Small.
- [x] 5. **Changelog order.** *Not a bug: #34 merged before #33, so the original order was right. #38 now orders by real merge time and shows PR numbers.* 1.45 sits above 1.6 because it sorts by minor number. Sorting by release date or fixing the heading style would make it read correctly. Tiny.

## Needs a decision or a device, so not a code fix today

- [ ] 6. **Nearby on a real phone (QA #4).** Needs a real device and real geolocation.
- [ ] 7. **No-service state (UI review #16).** Late-night or non-operating services were never checked. Needs a look at what the live backend returns at night.
- [ ] 8. **Placeholder contrast and the header dot (labelled in 1.108; #40, #45).** A quick audit first. The QA list says #45 is fixed while the UI list says open, so the doc needs checking.
- [ ] 9. **`/notes` layout at 375px and a hard refresh on the live site.** Nobody has looked. I'd just open it.

## Not bugs (earlier design reversals)

- Dark mode, crowd bars, bigger next bus, reordering and live dots. These were tried and reverted on purpose.

## Suggested grouping

- One small PR for 1, 3 and 4.
- Item 2 as its own PR, because it changes alert state.
- Item 5 can ride along with either.

## Follow-ups from #37 and #38

- [x] 10. **Fill in merge times for releases 1.67 (#37) and 1.73 (#38)** in `releases.ts`. Nothing detects a stale `shipped: null`. *Done in #39.*
- [ ] 11. **The MRT disruption card announcement.** Its status region mounts together with its content. Consider an always-mounted region. Needs a screen reader to verify. *Mobile: the banner now announces a disruption with `AccessibilityInfo` (#76), not yet checked with VoiceOver or TalkBack. The web card is unchanged.*
- [ ] 12. **Visual check of the alert cards.** The Hide button moved to the top of the card, and the notice and disruption cards sit as a group. Nobody has looked in a browser.
