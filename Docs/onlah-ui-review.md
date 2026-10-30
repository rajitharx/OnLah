# OnLah Web — UI Review

**Build reviewed:** https://onlah.pages.dev/
**Date:** 19 Oct 2026
**Viewports tested:** Mobile (375×812) and desktop
**Screens covered:** Saved, Search, Nearby, Board, Service details sheet, save/unsave flow

> Tick boxes show progress as of 24 Oct 2026, checked against the commit history and the current code. `[x]` means done, `[ ]` means still open. Numbers like #6 are pull requests.

---

## 1. Fix first (biggest impact)

- [x] 1. **Services are sorted as text, not numbers.** At Aft Victoria Lane the order is 12, 130, 133, 145, 175, 197, 2, 32, 33, 51, 61, 63, 7, 80. Use a natural sort that also handles suffixes like `10e` and `961M`.
- [x] 2. **Search shows nothing while it loads.** After typing "Victoria" the screen stayed blank for about 6–8 seconds before results appeared, probably the Render cold start. Add a "Searching…" or skeleton state, plus a "Waking up server…" message after about 3 seconds. *Done in #6.*
- [x] 3. **Search is wiped when you switch tabs.** Going from Search to Board and back clears the query and the results.
- [x] 4. **Nothing is in the URL.** Every view stays at `/`, so refresh, the back button and bookmarks all lose your place, and you can't share a stop link.
    - Use routes like `/stop/01121`.
    - Make the back button close the details sheet.
- [x] 5. **The nav and stop header scroll away.** A stop with 15 services is a long scroll, and you lose the tabs, the stop name and "Updated Xs ago." Make the nav, or at least a compact stop header, sticky.

## 2. Board and arrival tiles

- [ ] 6. **The whole tile is coloured by crowding.** Almost every tile is solid green, so the colour carries no information most of the time and the page looks loud. Try a neutral tile with a small 3–4 bar crowd indicator, as in the original design spec. *Open: neutral tiles with crowd bars were tried in #6 and reverted in #7, which restored the crowd-coloured tiles.*
- [x] 7. **Nothing explains the colours or icons.** Green, amber, the single- vs double-deck icon and the wheelchair icon have no legend. The icons are tiny (about 8px), and the SD and DD icons look almost the same.
- [ ] 8. **All three arrivals look equally important.** The next bus is what matters, so make it bigger or bolder and the 2nd and 3rd smaller. *Open: the next bus was drawn largest in #6, then #9 made every tile the same size on purpose.*
- [x] 9. **Cards don't say where the bus is going.** A commuter needs to know which direction 197 is heading from this stop. Add the destination under the service number. *Done in #28.*
- [x] 10. **Tiles show bare numbers.** "min" appears only in the section label "Next departures · minutes." Consider "16 min," or offer clock times for the 2nd and 3rd arrivals.
- [ ] 11. **The dark bar inside the coloured tile reads as a pill inside a pill.** The split-flap effect gets lost. Either commit to the flap look (with a seam line and flatter colour) or simplify. *Open: the tiles are coloured again, so the split-flap look is unchanged.*
- [x] 12. **The star button is small and oddly placed.** It's a 32px circle sitting mid-row next to the operator code. Move it to the right edge and make it at least 44px.
- [x] 13. **The operator code adds little.** `GAS`, `SBST` and `SMRT` are small and grey, and the sheet says "SBS Transit" instead. Drop the code from the card or keep the naming consistent.
- [x] 14. **You can't refresh by hand.** There's no pull-to-refresh or refresh button, and there's no stale warning if a fetch fails. The timer just keeps counting up. *Done: the manual refresh icon is in (#11), and a failed refresh now shows "Couldn't refresh. Showing data from Ns ago." with a Try again button.*
- [ ] 15. **The live dots don't match.** The "Updated" dot is grey and the header dot is red, so pick one meaning and one colour. *Open: the red dot was removed in #6, then restored in #7.*
- [ ] 16. **The no-service state is untested.** Make sure late-night or not-operating services show something clear rather than empty tiles.

## 3. Stop header

- [x] 17. **The two save buttons look alike.** Label the stop button "Save stop," since the bus star also means save.
- [x] 18. **The stop code chip looks like a disabled button.** Make it plain text, or make tapping it copy the code.
- [x] 19. **There's no map link or distance.** Add "Open in Maps" or a walking distance.
- [x] 20. **The Save button moves between layouts.** It sits under the address on mobile and top-right on desktop, which is fine, but on mobile it takes a full row.

## 4. Service details sheet

- [ ] 21. **It shows both directions equally.** Highlight the direction that serves this stop and collapse the other.
- [x] 22. **"Not published" rows waste space.** In the 197 sheet, Direction 2 has three of them. Hide those rows or merge them into one line.
- [x] 23. **The heading font changes.** "Service details" is in Space Grotesk, while every other heading uses the Newsreader serif.
- [x] 24. **The mobile sheet has no drag handle or swipe-to-dismiss.** The only close control is the small "CLOSE" text. Escape works on desktop, which is good.
- [x] 25. **There's no stop list for the route.** Even "next 5 stops" would help. *Done through the Route Tracker (#14), which lists every stop of the route. The details sheet itself has no stop list.*
- [x] 26. **The footnote is confusing.** It says weekend frequency isn't published, but Saturday and Sunday first and last bus times are shown just above. Label the frequency rows "Weekday frequency" and drop the footnote.

## 5. Saved

- [x] 27. **The buses section has no sub-label.** Stops have a "SAVED STOPS" label, but buses only get the page heading "Saved." Add "SAVED BUSES."
- [x] 28. **The two card styles don't match.** The bus badge is bold on Saved but thin on Board, and the stop name is a bold sans on Saved but a serif on Board.
- [x] 29. **Saved cards have no "Updated" indicator.** You also can't tell whether tapping the stop name opens its full board, so make that obvious.
- [x] 30. **The limit is shown too early.** "0 of 20 buses saved" highlights a limit nobody cares about yet. Show it only when the user is near the cap.
- [x] 31. **Empty states have no next step.** Add buttons like "Search stops" or "Find nearby" inside the dashed boxes.
- [x] 32. **First-time users land on an empty page.** If nothing is saved, open Nearby or Search by default.
- [ ] 33. **Saved items can't be reordered.** Let users reorder saved buses and stops, since everyone's commute order is different. *Open: reorder buttons were added in #6, then removed in #8.*

## 6. Search

- [x] 34. **The clear "×" is blue.** It's the only blue on the page and doesn't fit the palette.
- [x] 35. **"4 results (max 20)" is noisy.** Drop "(max 20)."
- [x] 36. **The input changes style when you type.** It's underline-only when empty and a white box once filled. Pick one.
- [ ] 37. **Results could show more.** List the buses each stop serves, and the distance if location is known.
- [x] 38. **Matches aren't highlighted.** Bold the matched text in results.
- [ ] 39. **Search may not cover bus numbers.** If it can't find stops by service number (for example "197"), consider adding that.
- [ ] 40. **The placeholder is light grey on cream at a fairly small size.** Check its contrast.

## 7. Nearby

- [x] 41. **The same message appears twice.** "Share your location to see stops nearby" and the empty box "Nearby stops appear once you share your location" say the same thing. Keep one.
- [x] 42. **Location permission needs more handling.** Add a line on why location is needed, and design the denied and unavailable states, with a fallback to Search.
- [x] 43. **Limit results to a 1 km radius.** Only show stops within 1 km of the user's location.
     - Sort by distance, nearest first, and show the distance on each card (e.g. "120 m", "0.8 km").
     - Say the radius in the subtitle, e.g. "Stops within 1 km".
     - Add an empty state for when nothing is within 1 km, e.g. "No stops within 1 km. Try Search instead," with a button that opens Search.

## 8. Header, navigation and global

- [x] 44. **The header uses about 130px of prime phone space** for "ONLAH," "Bus board" and a red dot. Compress it into a single line.
- [ ] 45. **The red dot is unexplained.** It has no label, no tooltip and nothing for screen readers. *Open: the red dot is back and still has no label.*
- [x] 46. **Navigation is at the top.** The target user is one-handed under time pressure, so a bottom tab bar would be easier to reach.
- [x] 47. **Nav buttons are 32px tall,** below the 44px iOS minimum.
- [x] 48. **"Board" is a detail view, not a destination.** Consider removing it from the tabs and opening the stop as a pushed screen with a back arrow.
- [x] 49. **Page headings sit almost against the nav pill.** "Saved" and "Search stops" need more breathing room.
- [x] 50. **The site uses three typefaces plus italic serif empty states.** It's Newsreader, Space Grotesk and Space Mono, which feels busy. Reduce to two.
- [ ] 51. **The look has drifted from the documented design direction.** The project notes describe dark-first, `#0a0a0a`, Share Tech Mono and Inter; the live site is cream with different fonts. The new look could be the better choice, but decide it on purpose and update the spec.
- [ ] 52. **There's no dark mode.** No `prefers-color-scheme` support, and commuters use this at night. *Open: dark mode was added in #6, then removed in #7 to restore the original colour scheme.*
- [x] 53. **The footer is 11px grey text** and invisible at the bottom of a long board. Fold the data source and refresh info into the "Updated" line instead.
- [x] 54. **Desktop layout is uneven.** At medium widths the tiles stretch very wide; at 1280px it's a narrow column with lots of empty cream. Consider a max width of about 480px, or two columns for services.
- [x] 55. **Home-screen basics are missing.** The favicon is empty (`data:,`), and there's no `apple-touch-icon`, web manifest or `theme-color`. Add-to-Home-Screen will look broken.

## 9. Already good, keep these

- The screen reader labels are strong, for example "16 minutes, Seats, DD, wheelchair accessible" and "Save bus 12."
- Escape closes the sheet and focus returns to the bus badge.
- `prefers-reduced-motion` is respected.
- `aria-current` is set on the active tab.

---

# OnLah Beta 1.5 — QA Pass

**Build tested:** OnLah Beta 1.5 (built-in browser)
**Viewports tested:** Desktop and 375px mobile
**Also checked:** Console, network, and direct API calls
**Works:** Search, save, Saved, Track, and the mobile layout mostly work.

> Tick boxes show progress as of 24 Oct 2026. `[x]` means done, `[ ]` means still open.

---

## Bugs

- [x] 1. **Road-name search doesn't search road names (high).**
    The placeholder says "e.g. 01012 or Victoria", but only stop descriptions were matched.
    - "Victoria" returns 4 stops, none of them 01012, 01013 or 01019, which are all on Victoria St.
    - "Victoria St" and "Orchard Rd" return 0 results, though stop 08137 is on Orchard Rd.
    - "Bukit Timah" and "Bukit Batok" return 0, because LTA stores them as "Bt Timah" and "Bt Batok".
    - Code search only matched the start of the code. "1012" returned 10121 and 10129, not 01012.
    - "Changi" returned exactly 20 results with no sign that the list was capped.

    The fix was to match `roadName` as well as `description`, expand LTA abbreviations on both sides (Bukit↔Bt, Road↔Rd, Street↔St, Avenue↔Ave, Station↔Stn, Interchange↔Int, Blk, Opp, Aft, Bef), make code search a contains match, and show "showing top 20" when results are capped.

- [x] 2. **LIKE wildcards in search aren't escaped (low).** `query=%%` returns stops, so `%` and `_` act as wildcards. It isn't SQL injection, since quotes and `' OR` strings return normally, but escape them anyway. *Done: the search rewrite in #17 only passes letters and digits to the database, so `%` and `_` no longer act as wildcards.*

- [x] 3. **Search error message is misleading (low).** A WAF rule blocks one query pattern (`x' or 1=1`) without a CORS header, so the UI shows "Search is unavailable right now. Try again." Retrying won't help. Treat a network failure on search differently from a 5xx, or say "Couldn't search that text". *Done in this PR.*

- [ ] 4. **Nearby is untested.** Geolocation was blocked in the test pane, so the real flow wasn't exercised.
    - The blocked state is handled well: it says location is blocked and offers a Search stops link.
    - The API works. At Victoria St with a 300 m radius it returned 9 stops with distances.
    - The API caps radius at 5000 m and returns 422 outside 1–5000.
    - **Action:** test Nearby on a real phone.

- [x] 5. **The disruption banner is untested (risky).** `train-alerts` returned no active alerts, so the banner never showed. The alert fetch ends in `.catch(()=>{})`, so a failed fetch looks the same as "no disruptions". Show an error or unknown state instead. *Done in this PR.* A failed fetch now shows a neutral "Service alerts unavailable" notice.

## Improvements

- [x] 6. **Tap targets (medium).** 24 controls are under 44px on mobile. Track links are 56×26, the Back link is 64×26, and the stars and details buttons are 36px. Pad them to 44px for one-handed use.
  - *Done in this PR.* Measured at 375px, the stars were already 44px. Every other small control keeps its look and gets an invisible 44px hit area: Track, Back, Hide, Clear, the service number buttons, Use my location, Saved stop, Show in Maps, the saved stop name and the wordmark link.
- [x] 7. **Red dot next to the wordmark (medium).** It is a decorative red `::after`, but red means "crowded" and "disruption" elsewhere. Make it neutral or drop it, and later use a dot beside the wordmark for real alert status. *Done in #20.* The dot is now the neutral ink colour.
- [x] 8. **Wheelchair icon on nearly every ETA cell (low).** At stop 01012 it appears about 30 times. Show it only when a bus is not accessible, or make it a filter.
  - *Done in #21.* ETA tiles show a crossed wheelchair only for buses without access. The legend and aria labels match.
- [x] 9. **Duplicate refresh buttons on Saved (low).** There is one per stop card and one per bus row.
  - *Done in #22.* Saved keeps the one re-sync button on each stop card. The bus rows no longer have their own.
- [x] 10. **ETA clock (to verify).** The ETA uses `Math.round((Date.parse(estimatedArrival) - c)/60000)`. If `c` is the phone's clock rather than the server's `fetchedAt`, a wrong device clock shows wrong ETAs. Confirm what `c` is. *Done in #23.* `c` was the phone's clock (`Date.now()` in `useNow`). ETAs and "Updated Ns ago" now use a clock anchored to the response's `fetchedAt` and carried forward by a monotonic timer.
- [x] 11. **Cold starts.** The Render free tier sleeps after about 15 minutes idle, so the first load can hang. Add a keep-alive ping to `/health` (for example a cron every 10 minutes) and a "Waking up…" state. *Done in #24*
- [x] 12. **Cache headers.** The API sends no `Cache-Control`. Stops and services rarely change, so set `max-age` on `bus-stops/*` and `bus-services/*`. *Done in #25*
- [x] 13. **Offline support.** There is no service worker. Caching the app shell and saved stops would help on the MRT. *Done in #26*
- [x] 14. **Page metadata.** The description is just "OnLah bus board". Add a better description and Open Graph tags (or an OG image) so shared links look right. *Done in #27*

## What works well

- Search is debounced and sends one request per query. Deep links like `/stop/01012` load correctly after a hard refresh.
- Save stop and save bus persist across navigation. "/" opens Saved when you have saved items and Search when you don't.
- Track shows the route, "YOU'RE HERE" and "BUS IS HERE" correctly, plus later buses.
- Accessibility is solid: arrival cells have full aria labels, there is a `prefers-reduced-motion` rule and `:focus-visible` styles, and the page has one `h1` and proper landmarks.
- The 375px layout has no horizontal overflow, and the last card clears the bottom nav.
- API validation is clean, with 422s and clear messages. There were no console errors from normal use. The client needs no API key.
