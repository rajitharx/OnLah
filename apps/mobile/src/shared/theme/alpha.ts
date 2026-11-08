// Turns a #RRGGBB palette colour into rgba() with an opacity, so tints derive from the palette
// instead of repeating its channel values.
export function withAlpha(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (match === null) throw new Error(`withAlpha needs a #RRGGBB colour, got ${hex}`);
  const [r, g, b] = [match[1], match[2], match[3]].map((part) => parseInt(part, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
