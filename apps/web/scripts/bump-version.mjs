import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The version is two numbers, major.minor. package.json is the one place it is written.
const VERSION_PATTERN = /^(\d+)\.(\d+)$/;

export function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version);
  if (match === null) throw new Error(`Version must be major.minor, got "${version}".`);
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function bumpVersion(version, kind) {
  const { major, minor } = parseVersion(version);
  if (kind === 'major') return `${major + 1}.0`;
  if (kind === 'minor') return `${major}.${minor + 1}`;
  throw new Error(`Unknown bump "${kind}". Use major or minor.`);
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);
if (isCli) {
  const packageUrl = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(readFileSync(packageUrl, 'utf8'));
  pkg.version = bumpVersion(pkg.version, process.argv[2]);
  writeFileSync(packageUrl, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`Version is now ${pkg.version}.`);
}
