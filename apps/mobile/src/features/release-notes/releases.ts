export type ItemKind = 'feature' | 'improvement' | 'fix';

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

// Newest first. Add one entry per merged batch of the web-parity work (see apps/mobile/WEB_PARITY.md).
export const releases: Release[] = [
  {
    version: '1.12',
    title: 'Easier to use with a screen reader',
    summary: 'Larger touch targets and clearer announcements.',
    items: [
      { kind: 'improvement', text: 'The Back buttons are now a full 44 points tall, so they are easier to hit.' },
      { kind: 'improvement', text: 'Train disruption alerts are announced when they appear, not only when the screen is read again.' },
      { kind: 'improvement', text: 'The search box is announced as a search field.' },
    ],
  },
  {
    version: '1.11',
    title: 'Release notes in the app',
    summary: 'Tap the version in the header to read what changed in each release.',
    items: [
      { kind: 'feature', text: 'The version label in the header opens the release notes, newest first.' },
    ],
  },
  {
    version: '1.10',
    title: 'Track a bus along its route',
    summary: 'Tap Track on a bus to see how many stops away it is and where it is on the route.',
    items: [
      { kind: 'feature', text: 'Track opens a screen with the next bus counted in stops away, or Arriving when it is about to pull in.' },
      { kind: 'feature', text: 'The next two buses are listed below, each with its crowd level, deck type and a Scheduled tag when it is not tracked live.' },
      { kind: 'feature', text: 'A route of stops shows where you are and where the bus is, and long stretches fold into +N stops that you can open.' },
      { kind: 'improvement', text: 'The route refreshes every 20 seconds, warns when the information is more than a minute old, and explains when a service is not running.' },
      { kind: 'improvement', text: 'Track works from the Saved, Nearby and Search tabs, and from saved buses.' },
    ],
  },
  {
    version: '1.9',
    title: 'Service details',
    summary: 'Tap a bus number to see who runs it, its route, hours and how often it comes.',
    items: [
      { kind: 'feature', text: 'Tapping a bus number opens a sheet with the operator, the kind of buses due now and each direction of the service.' },
      { kind: 'feature', text: 'Each direction shows its route, number of stops, first and last bus times, and how often buses come at peak and off-peak.' },
      { kind: 'improvement', text: 'Swipe the sheet down, tap outside it, or use the back button to close it. Details load only while it is open.' },
    ],
  },
  {
    version: '1.8',
    title: 'Save a bus at a stop',
    summary: 'Tap the star next to a bus to keep it on the Saved tab with its live times.',
    items: [
      { kind: 'feature', text: 'The star next to each bus on a stop board now saves that bus at that stop, up to 20 buses.' },
      { kind: 'feature', text: 'Saved shows your saved buses above your saved stops, grouped by stop, with live times that refresh every 20 seconds.' },
      { kind: 'improvement', text: 'Each saved stop has its own re-sync button, and a stop that fails to load keeps its last times with a notice.' },
      { kind: 'improvement', text: 'Saved shows how many of your 20 buses are used once you are close to the limit.' },
    ],
  },
  {
    version: '1.7',
    title: 'A Saved tab that opens first',
    summary: 'Home is now Saved, and the app opens on the right tab for you.',
    items: [
      { kind: 'feature', text: 'The Home tab is now Saved and lists your saved stops.' },
      { kind: 'feature', text: 'The app opens on Saved when you have saved stops, and on Search when you do not.' },
      { kind: 'improvement', text: 'Saved shows how many of your 10 stops are used once you are close to the limit.' },
      { kind: 'improvement', text: 'With nothing saved, Saved explains how to save a stop and offers Search stops and Find nearby.' },
    ],
  },
  {
    version: '1.6',
    title: 'Smarter Search and Nearby',
    summary: 'Search and Nearby now behave like the web bus board, with clearer messages when something goes wrong.',
    items: [
      { kind: 'feature', text: 'Search waits for you to stop typing, drops outdated requests, bolds the part of each stop name that matches, and shows at most 20 results.' },
      { kind: 'feature', text: 'Search tells you when the text is too short or a stop code is too long, and offers Try again when the server is unavailable.' },
      { kind: 'improvement', text: 'Your search text is kept when you switch tabs and come back.' },
      { kind: 'feature', text: 'Nearby has a Use my location button and a note that your location is not saved, then lists stops within 1 km, closest first.' },
      { kind: 'improvement', text: 'If location is blocked, unavailable or slow, Nearby says which, and offers Search stops instead.' },
      { kind: 'improvement', text: 'Empty results in Search and Nearby now explain what to do next.' },
    ],
  },
  {
    version: '1.5',
    title: 'A fuller bus board',
    summary: 'The arrivals screen now matches the web bus board: coloured time tiles, directions, notices and a Maps link.',
    items: [
      { kind: 'feature', text: 'Each bus shows its operator and up to three time tiles, filled by how crowded the bus is, with the deck type and a LAST tag on the final bus.' },
      { kind: 'feature', text: 'A crossed wheelchair marks buses that are not wheelchair accessible, with a legend that explains the colours.' },
      { kind: 'feature', text: 'Services that run in both directions show each direction on its own, with the route from start to end.' },
      { kind: 'feature', text: 'Show in Maps opens the stop in your map app.' },
      { kind: 'improvement', text: 'Times refresh quietly every 20 seconds, with an update age chip, a re-sync button and a notice when a refresh fails.' },
      { kind: 'improvement', text: 'A short note appears when a stop has no buses due, and the Save stop button says when your saved stops are full.' },
      { kind: 'improvement', text: 'Track and save-bus buttons are in place and switch on in a later release.' },
    ],
  },
  {
    version: '1.4',
    title: 'Live data status and shared building blocks',
    summary: 'A header on every tab shows whether live data is online, and the pieces the web bus board screens use are now in the app.',
    items: [
      { kind: 'feature', text: 'A header with a status dot shows whether live data is online, slow or offline, next to the Beta version.' },
      { kind: 'feature', text: 'A notice tells you when the phone is offline, and saved stops still open.' },
      { kind: 'improvement', text: 'The train disruption banner now shows on every tab, not only on Home.' },
      { kind: 'improvement', text: 'Loading placeholders say the server is waking up when the first load takes longer than 3 seconds.' },
      { kind: 'improvement', text: 'New shared pieces: update age chip, re-sync button, stale data notice, empty states, stop cards with search highlight, operator names, bus time legend and a crossed wheelchair icon.' },
    ],
  },
  {
    version: '1.3',
    title: 'Groundwork for the web bus board features',
    summary: 'The rules behind the web bus board now live in the app, ready for the screens that use them.',
    items: [
      { kind: 'improvement', text: 'Saved stops are capped at 10 and saved buses at 20, the same as on the web.' },
      { kind: 'improvement', text: 'Search checks what you type before asking the server, and bolds the part of a stop name that matches.' },
      { kind: 'improvement', text: 'Bus times keep the last good data on screen when a refresh fails, and ignore a late reply that is older than what you see.' },
      { kind: 'improvement', text: 'Services that stop in both directions can be split by direction, and service numbers sort by number, so 12 comes before 130.' },
      { kind: 'improvement', text: 'The route tracker has its "N stops away" wording and the rail of stops ready.' },
    ],
  },
  {
    version: '1.2',
    title: 'Sturdier connection to live data',
    summary: 'Requests now time out, report clear errors, and refreshes pause while the app is in the background.',
    items: [
      { kind: 'improvement', text: 'Bus times refresh only while the app is open on screen, and never overlap, which saves battery and data.' },
      { kind: 'improvement', text: 'A request that gets no answer now ends after 15 seconds instead of hanging.' },
      { kind: 'improvement', text: 'Error messages from the server are now read and kept, so screens can say what went wrong.' },
      { kind: 'improvement', text: 'Every response keeps the app clock in step with the server, so arrival times stay right even if the phone clock is off.' },
    ],
  },
  {
    version: '1.1',
    title: 'Web parity plan and release notes',
    summary: 'The mobile app starts catching up with the web bus board.',
    items: [
      { kind: 'improvement', text: 'The app guide now covers saved buses, service details, the route tracker and the live data status dot.' },
      { kind: 'feature', text: 'Mobile now keeps its own release notes, a list of what changed in each version.' },
    ],
  },
];
