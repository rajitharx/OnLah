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
    version: '1.1',
    title: 'Web parity plan and release notes',
    summary: 'The mobile app starts catching up with the web bus board.',
    items: [
      { kind: 'improvement', text: 'The app guide now covers saved buses, service details, the route tracker and the live data status dot.' },
      { kind: 'feature', text: 'Mobile now keeps its own release notes, a list of what changed in each version.' },
    ],
  },
];
