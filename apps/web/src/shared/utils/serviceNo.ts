const LEADING_NUMBER = /^(\d+)(.*)$/;

// Service numbers are text, so "130" sorts before "2". Compare the leading number first, then any suffix.
export function compareServiceNos(a: string, b: string): number {
  const matchA = LEADING_NUMBER.exec(a);
  const matchB = LEADING_NUMBER.exec(b);
  if (matchA === null || matchB === null) return a.localeCompare(b);

  const byNumber = Number(matchA[1]) - Number(matchB[1]);
  return byNumber !== 0 ? byNumber : matchA[2].localeCompare(matchB[2]);
}

export function sortByServiceNo<T extends { serviceNo: string }>(services: T[]): T[] {
  return [...services].sort((a, b) => compareServiceNos(a.serviceNo, b.serviceNo));
}
