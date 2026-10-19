export function parseVersion(version: string): { major: number; minor: number };
export function bumpVersion(version: string, kind: 'major' | 'minor'): string;
