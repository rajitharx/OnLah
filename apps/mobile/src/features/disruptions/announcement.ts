// The banner heading, shown and spoken from this one place.
export function disruptionTitle(line: string | undefined): string {
  return `${line ?? 'Train'} disruption`;
}

// What to say when a train disruption shows, or null when there is nothing new to say.
// `lastSpoken` is what was announced for the banner now on screen. Same words again means no repeat.
export function disruptionAnnouncement(
  visible: boolean,
  line: string | undefined,
  message: string | undefined,
  lastSpoken: string | null,
): string | null {
  if (!visible) return null;
  const text = [disruptionTitle(line), message].filter(Boolean).join('. ');
  return text === lastSpoken ? null : text;
}
