// What to say when a train disruption shows, or null when there is nothing new to say.
// `lastSpoken` is what was announced for the banner now on screen. Same words again means no repeat.
export function disruptionAnnouncement(
  visible: boolean,
  line: string | undefined,
  message: string | undefined,
  lastSpoken: string | null,
): string | null {
  if (!visible) return null;
  const text = [`${line ?? 'Train'} disruption`, message].filter(Boolean).join('. ');
  return text === lastSpoken ? null : text;
}
