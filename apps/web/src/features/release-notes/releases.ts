export type ItemKind = 'feature' | 'improvement' | 'fix';
export type RoadmapStatus = 'shipped' | 'next' | 'later';

export interface ReleaseItem {
  kind: ItemKind;
  text: string;
}

// `shipped` is the committer date of the PR's merge commit on main (git log --first-parent --format=%cI).
// null with a pr means the PR is still open: fill it in after the merge. null without a pr is
// history from before the pull request workflow. A merge time without a pr cannot exist.
export type Shipping =
  | { pr: number; shipped: string }
  | { pr: number; shipped: null }
  | { pr: null; shipped: null };

export type Release = Shipping & {
  version: string;
  title: string;
  summary: string;
  items: ReleaseItem[];
};

export interface RoadmapItem {
  status: RoadmapStatus;
  text: string;
  review?: string[];
}

export const ITEM_KINDS: Record<ItemKind, { label: string; className: string }> = {
  feature: { label: 'Feature', className: 'kind-feature' },
  improvement: { label: 'Improvement', className: 'kind-improvement' },
  fix: { label: 'Bug fix', className: 'kind-fix' },
};

export const ROADMAP_STATUSES: { status: RoadmapStatus; label: string; blurb: string }[] = [
  { status: 'shipped', label: 'Shipped', blurb: 'Done and live.' },
  { status: 'next', label: 'Next', blurb: 'Open items from the UI review and QA pass, closest to ready.' },
  { status: 'later', label: 'Later', blurb: 'Open items that need a decision first, or were tried and reverted.' },
];

export const features: string[] = [
  'Live bus arrivals for any Singapore bus stop, with three ETAs per service, crowd level, bus type and wheelchair access.',
  'Search stops by code or road name, and find stops within 1 km of you.',
  'Save up to 20 buses and 10 stops. They stay on your device and refresh together on the Saved tab.',
  'Route Tracker: follow one service at one stop, with a "N stops away" countdown and a rail of every stop.',
  'A LAST tag on the final bus of the night, and a banner when the MRT is disrupted.',
  'The app opens offline once loaded; arrival times need a connection. Every screen has its own link you can bookmark.',
];

export const releases: Release[] = [
  {
    version: '1.104',
    pr: 59,
    shipped: null,
    title: 'Safer edges and narrower-screen layout',
    summary: 'The page and bus popup clear the home-bar on notched phones, the popup stops stretching on desktop, and the stop header copes at 320px.',
    items: [
      { kind: 'fix', text: 'The page now extends under the notch and home bar when installed (top and side insets are kept clear), and the tab bar clearance and bus popup padding include the bottom safe area.' },
      { kind: 'improvement', text: 'The bus popup is a centred panel no wider than 560px on desktop, and its height follows the visible screen on phones.' },
      { kind: 'fix', text: 'On very narrow phones the Save stop button drops under the stop name instead of squeezing it, and the "Open board" cue on a saved stop is hidden.' },
      { kind: 'improvement', text: 'The stop code is plain text in every list, like on the board, instead of a bordered chip that looked like a disabled button.' },
    ],
  },
  {
    version: '1.103',
    pr: 58,
    shipped: null,
    title: 'Track follows the direction you tapped',
    summary: 'A bus that runs both ways at a stop shows one row per direction, and Track opens the direction of that row.',
    items: [
      { kind: 'fix', text: 'Each direction of a bus at a stop is its own row with its own route line, so the other direction no longer shows empty tiles.' },
      { kind: 'fix', text: 'Track opens the direction of the row you tapped instead of always the first one.' },
    ],
  },
  {
    version: '1.102',
    pr: 57,
    shipped: null,
    title: 'Each direction shows its own buses',
    summary: 'A service that stops here in both directions shows each direction with its own route line and tiles.',
    items: [
      { kind: 'fix', text: 'Buses such as 136 at stop 66271 no longer list both routes above one row of tiles. Each route line now sits above the buses heading that way.' },
    ],
  },
  {
    version: '1.101',
    pr: 53,
    shipped: null,
    title: 'No page jump while loading, Saved matches the board',
    summary: 'Loading shows placeholders in the shape of the board, and a saved bus has its route line, Track link and tiles.',
    items: [
      { kind: 'improvement', text: 'The board and a stop opened from a link show placeholders while the times load, so the page no longer jumps and the stop link no longer looks like "not found".' },
      { kind: 'improvement', text: 'Saved buses show the origin to destination line, the Track link and the three tiles, as on the board. A bus with nothing due shows empty tiles.' },
    ],
  },
  {
    version: '1.100',
    pr: 52,
    shipped: null,
    title: 'Readable errors and a steadier Track link',
    summary: 'Error text and the MRT banner title are ink instead of red, and the Track link sits next to the star at the right edge of the row.',
    items: [
      { kind: 'fix', text: 'Error messages are dark ink with a red bar on the left, and the MRT disruption title is ink with a red icon, so they meet contrast on the cream page and white cards.' },
      { kind: 'fix', text: 'The Track link sits at the right edge of a service row, next to the star, instead of mid-row.' },
    ],
  },
  {
    version: '1.95',
    pr: 49,
    shipped: null,
    title: 'Easier-to-read arrival times',
    summary: 'The minutes on each ETA tile are larger, and the text under them is no smaller than 11px.',
    items: [
      { kind: 'improvement', text: 'The minutes, "min" and the footer on every ETA tile are larger, so the time is no longer the smallest bold text on the board.' },
      { kind: 'fix', text: 'The "No bus" tile text is brighter, so it reads against the dark tile.' },
    ],
  },
  {
    version: '1.93',
    pr: 47,
    shipped: '2026-11-04T09:25:31+08:00',
    title: 'Steadier live refresh',
    summary: 'Bus times refresh one request at a time, pause in a hidden tab, and stay in step across tabs.',
    items: [
      { kind: 'fix', text: 'A stop never has two arrival requests running at once, from the timer, Refresh or Re-sync, so a slow response cannot replace newer times. A response older than the one on screen is ignored.' },
      { kind: 'fix', text: 'Bus arrivals, saved buses and service alerts pause while the tab is hidden and refresh as soon as it is visible again.' },
      { kind: 'fix', text: 'The Route Tracker stops refreshing once the service is not found at the stop.' },
      { kind: 'fix', text: 'Opening another stop no longer flashes the previous stop\'s times.' },
      { kind: 'improvement', text: 'Only the ages, ETAs and the Route Tracker update every second, not the whole page.' },
      { kind: 'fix', text: 'Saved buses and stops changed in another tab appear here, and saving in two tabs keeps both changes.' },
    ],
  },
  {
    version: '1.92',
    pr: 42,
    shipped: '2026-11-04T09:21:47+08:00',
    title: 'Retry after a failed lookup',
    summary: 'Nearby, search and stop links now have a way to try again after a failure, and a network error no longer says "Try different words".',
    items: [
      { kind: 'fix', text: 'Nearby: "Use my location" again, or "Try again", fetches again. Before, the same coordinates never refetched.' },
      { kind: 'fix', text: 'Search: "Try again" searches the same text again. A network error, or any failure while offline, reads "Search is unavailable right now. Try again."' },
      { kind: 'fix', text: 'A stop opened from a link that fails to load has a "Try again" button.' },
    ],
  },
  {
    version: '1.89',
    pr: 43,
    shipped: '2026-11-04T09:11:12+08:00',
    title: 'Announcements and focus',
    summary: 'Screen changes, search results and failed refreshes are now announced, and focus no longer falls to the top of the page.',
    items: [
      { kind: 'fix', text: 'Moving to another screen puts focus on its heading and sets the tab title, such as "Stop 01012 · Hotel Grand Pacific · OnLah". The first page load is left alone.' },
      { kind: 'fix', text: 'Search has one status line that says "Searching…", then the result count or that nothing matches.' },
      { kind: 'fix', text: 'Opening "+N stops" in the Route Tracker moves focus to the first stop it reveals, and the section stays open when the bus moves.' },
      { kind: 'fix', text: 'On Saved, a failed refresh is announced politely per stop, and one alert appears when every saved stop failed.' },
    ],
  },
  {
    version: '1.87',
    pr: 41,
    shipped: '2026-11-04T09:06:49+08:00',
    title: 'Bus details sheet: Back and keyboard focus',
    summary: 'Closing the bus details sheet no longer leaves a duplicate board in the history, and the sheet now handles keyboard focus.',
    items: [
      { kind: 'fix', text: 'Closing a bus details sheet opened from the board steps back, so Back and the on-screen back arrow leave the board instead of landing on the same board again. A sheet opened from a direct link or from the Saved tab still closes in place.' },
      { kind: 'fix', text: 'The sheet moves focus to its Close button when it opens, keeps Tab inside it, and returns focus to the control that opened it when it closes.' },
    ],
  },
  {
    version: '1.73',
    pr: 38,
    shipped: '2026-11-02T09:00:54+08:00',
    title: 'Release history by merge time',
    summary: 'This list runs newest merged first. Each entry records when its pull request merged and shows the pull request number.',
    items: [
      { kind: 'improvement', text: 'Releases are ordered by the time their pull request merged, not by version or pull request number. Pull request 33 merged just after 34, so 1.45 sits above 1.6.' },
      { kind: 'improvement', text: 'A test checks that the merge times descend here, that the changelog lists the same pull requests in the same order, and that only unmerged work at the top and early history at the end lack a merge time.' },
      { kind: 'improvement', text: 'A test checks that the files reachable from version.ts, within src/shared and scripts, do not import any node: specifier, whatever the module, or a bare built-in from its fixed list (fs, path, url, os, child_process, crypto, util, stream, http, https, net, zlib, buffer, events, assert, module, worker_threads, readline, tty, vm, and their subpaths), or contain the text "process." (a bare process is not flagged). It follows quoted import, export-from and dynamic import specifiers. A file that version.ts does not import is not checked. It does not follow computed specifiers or imports that resolve to other folders, and it does not know built-ins missing from its list.' },
    ],
  },
  {
    version: '1.67',
    pr: 37,
    shipped: '2026-11-02T08:58:14+08:00',
    title: 'Clearer stale and alert notices',
    summary: 'A failed refresh no longer repeats the data age, and a failed alerts refresh no longer reads as all clear.',
    items: [
      { kind: 'fix', text: 'The Route Tracker shows the data age once when a refresh fails, in the "Couldn\'t refresh" notice, not again in the header.' },
      { kind: 'fix', text: 'If a service alerts refresh fails after a result, the page says "Couldn\'t refresh service alerts" with the time of the last check, whether or not that result had alerts. It clears on the next success.' },
      { kind: 'fix', text: 'The "unavailable" and "couldn\'t refresh" notices sit in a status region that is always on the page. The disruption card\'s own status region appears with the alerts, so announcing a newly appearing disruption is not guaranteed. This is not tested with a screen reader. The ticking age is kept outside every status region.' },
    ],
  },
  {
    version: '1.54',
    pr: 36,
    shipped: '2026-10-30T11:26:36+08:00',
    title: 'Build and release labels',
    summary: 'This page now tells the build number apart from the release history.',
    items: [
      { kind: 'fix', text: 'The top of this page shows "This build" and "Release notes cover up to" instead of a single version that looked newer than the latest release.' },
      { kind: 'improvement', text: 'A test checks that the build is never older than the newest release listed here.' },
      { kind: 'improvement', text: 'The roadmap guard test now checks that it parses every open checkbox in the UI review document.' },
    ],
  },
  {
    version: '1.51',
    pr: 35,
    shipped: '2026-10-30T11:18:37+08:00',
    title: 'Release notes and roadmap',
    summary: 'This page. It is not linked from the app, so open it by URL at /notes or /about.',
    items: [
      { kind: 'feature', text: 'A release history, a Shipped / Next / Later roadmap and a features overview.' },
    ],
  },
  {
    version: '1.45',
    pr: 33,
    shipped: '2026-10-29T21:14:02+08:00',
    title: 'Service alerts unavailable',
    summary:
      'When the MRT alerts fail to load, the page now says so instead of showing nothing, which used to look the same as "no disruptions".',
    items: [
      { kind: 'fix', text: 'A failed alerts load shows a "Service alerts unavailable" notice, announced to screen readers as a status.' },
      { kind: 'improvement', text: 'The notice is neutral, without the red used for real disruptions.' },
    ],
  },
  {
    version: '1.6',
    pr: 34,
    shipped: '2026-10-29T21:10:46+08:00',
    title: 'Stale arrivals warning',
    summary:
      'When a refresh fails, the last times stay on screen and a notice says how old they are, with a Try again button.',
    items: [
      { kind: 'fix', text: 'A failed refresh shows "Couldn\'t refresh. Showing data from Ns ago." and clears on the next success.' },
      { kind: 'improvement', text: 'One shared notice for the stop board, saved stops and the Route Tracker, with an amber border rather than a red one.' },
      { kind: 'improvement', text: 'Try again reuses the existing manual refresh.' },
    ],
  },
  {
    version: '1.5',
    pr: 16,
    shipped: '2026-10-21T23:35:41+08:00',
    title: 'Last bus',
    summary: 'The ETA tile for a service\'s last bus of the night carries a "LAST" tag.',
    items: [
      { kind: 'feature', text: 'A LAST tag with a slowly pulsing dot on the stop board and on saved buses. Screen readers hear "last bus".' },
      { kind: 'improvement', text: 'With reduced motion the dot does not pulse.' },
      { kind: 'feature', text: 'The backend matches each ETA against the published last-bus time at that stop. It is an estimate, not an LTA signal.' },
    ],
  },
  {
    version: '1.1',
    pr: 14,
    shipped: '2026-10-21T13:38:11+08:00',
    title: 'Route Tracker',
    summary: 'Follow one bus service at one stop.',
    items: [
      { kind: 'feature', text: 'A "N stops away" countdown for the next bus, with its ETA and crowd level.' },
      { kind: 'feature', text: 'A vertical rail of the service\'s stops in order, marking the bus and your stop, with long stretches folded into "+N stops".' },
      { kind: 'feature', text: 'A strip for the second and third buses, and a Track link on every service row.' },
      { kind: 'feature', text: 'States for loading, live, scheduled, no estimate, not in operation, a failed refresh and an unknown stop or service.' },
    ],
  },
  {
    version: '0.4',
    pr: null,
    shipped: null,
    title: 'Review fixes and polish',
    summary: 'Versions 0.1 to 0.4: the first round of fixes from the UI review.',
    items: [
      { kind: 'fix', text: 'Services sort in natural order, so 2 comes before 12.' },
      { kind: 'feature', text: 'URL routes for each screen, a bottom tab bar, and a Saved tab with re-sync.' },
      { kind: 'improvement', text: 'Search status messages, plain deck labels, equal-size tiles and the Beta version label.' },
      { kind: 'improvement', text: 'The wordmark links to the home page, and the version bumps automatically on commit.' },
    ],
  },
];

export const roadmap: RoadmapItem[] = [
  { status: 'shipped', text: 'Route Tracker with a stop rail, now showing bus load and travel direction (#14, #30).' },
  { status: 'shipped', text: 'Last bus tag (#16).' },
  { status: 'shipped', text: 'Origin and destination on each bus card (#28).' },
  { status: 'shipped', text: 'Stop search by road name with LTA abbreviations, and a note when results are capped at 20 (#17).' },
  { status: 'shipped', text: '44px tap targets on small controls (#19).' },
  { status: 'shipped', text: 'ETAs computed against the backend clock, not the device clock (#23).' },
  { status: 'shipped', text: 'Offline app shell (#26), page description and share image (#27), cache headers on reference data (#25).' },
  { status: 'shipped', text: 'Neutral wordmark dot (#20), crossed wheelchair only for inaccessible buses (#21), one refresh control per saved stop (#22).' },
  { status: 'shipped', text: 'Stale arrivals warning with Try again (#34).' },
  { status: 'shipped', text: 'Service alerts unavailable state (#33).' },
  { status: 'shipped', text: 'Clearer stale and alert notices: one data age, a failed alerts refresh notice, and a live status region.' },
  { status: 'next', text: 'Check the no-service state for late-night and not-operating services.', review: ['ui-16'] },
  { status: 'next', text: 'Test Nearby on a real phone.', review: ['qa-4'] },
  { status: 'next', text: 'Search by bus number as well as stop.', review: ['ui-39'] },
  { status: 'next', text: 'Show the buses each search result serves, and the distance when location is known.', review: ['ui-37'] },
  { status: 'next', text: 'Check the contrast of the search placeholder.', review: ['ui-40'] },
  { status: 'next', text: 'Give the header dot a label for screen readers.', review: ['ui-45'] },
  { status: 'next', text: 'In the service details sheet, highlight the direction that serves this stop and collapse the other.', review: ['ui-21'] },
  { status: 'later', text: 'Decide the look on purpose and update the design spec, which still describes a dark-first design.', review: ['ui-51'] },
  { status: 'later', text: 'Dark mode. Tried in #6, removed in #7.', review: ['ui-52'] },
  { status: 'later', text: 'Neutral tiles with crowd bars. Tried in #6, reverted in #7.', review: ['ui-6'] },
  { status: 'later', text: 'Make the next bus larger than the 2nd and 3rd. Tried in #6, undone in #9.', review: ['ui-8'] },
  { status: 'later', text: 'Reorder saved buses and stops. Added in #6, removed in #8.', review: ['ui-33'] },
  { status: 'later', text: 'Decide whether the dark bar inside the coloured tile stays, or commit to the split-flap look with a seam line and flatter colour.', review: ['ui-11'] },
  { status: 'later', text: 'One meaning and colour for the live dots. Changed in #6, restored in #7.', review: ['ui-15'] },
];
