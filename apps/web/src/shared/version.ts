import pkg from '../../package.json';

// Read from package.json, the one place the version is written. Bump it with `npm run bump:minor` or `npm run bump:major`.
export const APP_VERSION: string = pkg.version;

export function betaLabel(version: string): string {
  return `Beta ${version}`;
}
