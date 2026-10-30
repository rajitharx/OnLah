const VERSION_PATTERN = /^(\d+)\.(\d+)$/;

export function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version);
  if (match === null) throw new Error(`Version must be major.minor, got "${version}".`);
  return { major: Number(match[1]), minor: Number(match[2]) };
}
