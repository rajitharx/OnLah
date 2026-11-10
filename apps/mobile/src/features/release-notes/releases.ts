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
