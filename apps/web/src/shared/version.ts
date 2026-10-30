import pkg from '../../package.json';
import { parseVersion } from '../../scripts/version-core.mjs';

// Read from package.json, the one place the version is written. Bump it with `npm run bump:minor` or `npm run bump:major`.
export const APP_VERSION: string = pkg.version;

export function betaLabel(version: string): string {
  return `Beta ${version}`;
}

export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  return left.major - right.major || left.minor - right.minor;
}
