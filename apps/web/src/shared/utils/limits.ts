// The cap only matters once the list is nearly full. Before that, a count is enough.
const NEAR_LIMIT_SHARE = 0.75;

export function isNearLimit(count: number, max: number): boolean {
  return count >= Math.ceil(max * NEAR_LIMIT_SHARE);
}
