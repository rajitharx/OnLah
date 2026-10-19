// The version shown in the header. Bump it with package.json when a release goes out.
export const APP_VERSION = '0.1.0';

export function betaLabel(version: string): string {
  return `Beta ${version}`;
}
