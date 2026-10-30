export type ItemKind = 'feature' | 'improvement' | 'fix';
export type RoadmapStatus = 'shipped' | 'next' | 'later';

export interface ReleaseItem {
  kind: ItemKind;
  text: string;
}

export interface Release {
  version: string;
  title: string;
  summary: string;
  items: ReleaseItem[];
}

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
    version: '1.67',
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
    title: 'Release notes and roadmap',
    summary: 'This page. It is not linked from the app, so open it by URL at /notes or /about.',
    items: [
      { kind: 'feature', text: 'A release history, a Shipped / Next / Later roadmap and a features overview.' },
    ],
  },
  {
    version: '1.45',
    title: 'Service alerts unavailable',
    summary:
      'When the MRT alerts fail to load, the page now says so instead of showing nothing, which used to look the same as "no disruptions". (PR #33)',
    items: [
      { kind: 'fix', text: 'A failed alerts load shows a "Service alerts unavailable" notice, announced to screen readers as a status.' },
      { kind: 'improvement', text: 'The notice is neutral, without the red used for real disruptions.' },
    ],
  },
  {
    version: '1.6',
    title: 'Stale arrivals warning',
    summary:
      'When a refresh fails, the last times stay on screen and a notice says how old they are, with a Try again button. (PR #34)',
    items: [
      { kind: 'fix', text: 'A failed refresh shows "Couldn\'t refresh. Showing data from Ns ago." and clears on the next success.' },
      { kind: 'improvement', text: 'One shared notice for the stop board, saved stops and the Route Tracker, with an amber border rather than a red one.' },
      { kind: 'improvement', text: 'Try again reuses the existing manual refresh.' },
    ],
  },
  {
    version: '1.5',
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
