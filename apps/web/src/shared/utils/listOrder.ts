// Swaps the item at `index` with its nearest neighbour in `delta` direction that is in the same group.
// Returns the same list when there is no such neighbour, so the buttons can stay simple.
export function moveItem<T>(list: T[], index: number, delta: -1 | 1, sameGroup: (a: T, b: T) => boolean = () => true): T[] {
  const item = list[index];
  let target = index + delta;
  while (target >= 0 && target < list.length && !sameGroup(item, list[target])) target += delta;
  if (target < 0 || target >= list.length) return list;

  const next = [...list];
  next[index] = list[target];
  next[target] = item;
  return next;
}
