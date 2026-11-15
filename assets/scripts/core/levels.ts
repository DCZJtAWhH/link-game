export interface Level { number: number; columns: number; rows: number; types: number; seconds: number }

/** Forty configured levels, with constant parameters within each difficulty tier. */
export const LEVELS: readonly Level[] = Array.from({ length: 40 }, (_, index) => {
  const number = index + 1;
  const [columns, rows, types] = number <= 5 ? [4, 4, 4] : number <= 10 ? [4, 6, 6] : number <= 20 ? [6, 6, 8] : [6, 8, 10];
  return { number, columns: columns!, rows: rows!, types: types!, seconds: 300 };
});
