export interface Point { x: number; y: number }
export type Pair = [number, number];
export interface BoardLayout { board: (number | null)[]; solution: Pair[] }

/** Returns a corner-only orthogonal path, including the one-cell outside channel. */
export function connection(board: readonly (number | null)[], columns: number, rows: number, first: number, second: number): Point[] | null {
  if (first === second || board[first] == null || board[second] == null) return null;
  const from = { x: first % columns, y: Math.floor(first / columns) };
  const to = { x: second % columns, y: Math.floor(second / columns) };
  const clear = (a: Point, b: Point): boolean => {
    if (a.x !== b.x && a.y !== b.y) return false;
    const dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y);
    let x = a.x, y = a.y;
    while (true) {
      const index = y * columns + x;
      if (x >= 0 && x < columns && y >= 0 && y < rows && index !== first && index !== second && board[index] !== null) return false;
      if (x === b.x && y === b.y) return true;
      x += dx; y += dy;
    }
  };
  const candidates: Point[][] = [[from, to], [from, { x: from.x, y: to.y }, to], [from, { x: to.x, y: from.y }, to]];
  for (let x = -1; x <= columns; x++) candidates.push([from, { x, y: from.y }, { x, y: to.y }, to]);
  for (let y = -1; y <= rows; y++) candidates.push([from, { x: from.x, y }, { x: to.x, y }, to]);
  for (const candidate of candidates) {
    const path = candidate.filter((point, index) => index === 0 || point.x !== candidate[index - 1]!.x || point.y !== candidate[index - 1]!.y);
    if (path.slice(1).every((point, index) => clear(path[index]!, point))) return path;
  }
  return null;
}

/** Remove geometric pairs first, then assign fruit pairs in that exact removal order.
 * There is always a geometric pair: two consecutive occupied cells in a row, or
 * (when every row has at most one) cells in consecutive occupied rows. No retries.
 */
export function generate(columns: number, rows: number, types: number, random: () => number): BoardLayout {
  const geometry: (number | null)[] = Array<number>(columns * rows).fill(0);
  const solution: Pair[] = [];
  while (geometry.some(cell => cell !== null)) {
    const candidates: Pair[] = [];
    for (let first = 0; first < geometry.length; first++) {
      if (geometry[first] === null) continue;
      for (let second = first + 1; second < geometry.length; second++) {
        if (geometry[second] !== null && connection(geometry, columns, rows, first, second)) candidates.push([first, second]);
      }
    }
    const pair = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    if (!pair) throw new Error('Unable to construct geometric removal order');
    solution.push(pair);
    geometry[pair[0]] = null; geometry[pair[1]] = null;
  }
  const fruitPairs = solution.map((_, index) => index % types);
  for (let index = fruitPairs.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [fruitPairs[index], fruitPairs[other]] = [fruitPairs[other]!, fruitPairs[index]!];
  }
  const board: (number | null)[] = Array<null>(columns * rows).fill(null);
  solution.forEach(([first, second], index) => { board[first] = fruitPairs[index]!; board[second] = fruitPairs[index]!; });
  return { board, solution };
}
