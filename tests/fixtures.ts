// The complete agreed sample pool: three initial and three reshuffle seeds per tier.
export const INITIAL_SEEDS = [11, 29, 47];
export const SHUFFLE_SEEDS = [101, 103, 107];

export function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
