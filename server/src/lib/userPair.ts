/** Stable ordering for DM conversation unique key */
export function sortedUserPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
