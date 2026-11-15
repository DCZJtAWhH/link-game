import { expect, test } from 'vitest';
import { Game } from '../assets/scripts/core/Game';

// The agreed public gameplay boundary; these three seeds are the entire first-tier pool.
export const INITIAL_SEEDS = [11, 29, 47];
function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

test('第1关三个初始样本符合数量约束，并经合法配对完整清盘', () => {
  for (const seed of INITIAL_SEEDS) {
    const game = new Game({ random: random(seed) });
    game.start();
    const initial = game.state;
    expect([initial.columns, initial.rows, initial.board.length]).toEqual([4, 4, 16]);
    const counts = new Map<number, number>();
    initial.board.forEach(fruit => { if (fruit !== null) counts.set(fruit, (counts.get(fruit) ?? 0) + 1); });
    expect(counts.size).toBe(4);
    expect([...counts.values()].every(count => count % 2 === 0)).toBe(true);
    for (const [first, second] of initial.solution) {
      const before = game.state.board.filter(fruit => fruit !== null).length;
      game.select(first);
      game.select(second);
      expect(game.state.feedback?.kind).toBe('match');
      expect(game.state.feedback?.path.length).toBeGreaterThanOrEqual(2);
      const path = game.state.feedback!.path;
      expect(path.length).toBeLessThanOrEqual(4);
      for (let part = 1; part < path.length; part++) {
        const from = path[part - 1]!, to = path[part]!;
        expect(from.x === to.x || from.y === to.y).toBe(true);
        const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
        let x = from.x, y = from.y;
        while (true) {
          expect(x >= -1 && x <= initial.columns && y >= -1 && y <= initial.rows).toBe(true);
          if (x >= 0 && x < initial.columns && y >= 0 && y < initial.rows) {
            const index = y * initial.columns + x;
            if (index !== first && index !== second) expect(game.state.board[index]).toBeNull();
          }
          if (x === to.x && y === to.y) break;
          x += dx; y += dy;
        }
      }
      game.advance(0.2);
      expect(game.state.board.filter(fruit => fruit !== null).length).toBe(before - 2);
    }
    expect(game.state.phase).toBe('won');
  }
});

test('同一初始样本复用：选中取消、误配保留后图块，暂停停止倒计时，超时锁定并可重试', () => {
  const game = new Game({ random: random(INITIAL_SEEDS[0]!) });
  game.start();
  const initial = game.state;
  game.select(0);
  expect(game.state.selected).toBe(0);
  game.select(0);
  expect(game.state.selected).toBeNull();
  const different = initial.board.findIndex(fruit => fruit !== initial.board[0]);
  game.select(0); game.select(different);
  expect(game.state.selected).toBe(different);
  expect(game.state.feedback?.kind).toBe('mismatch');
  expect(game.state.remaining).toBe(300);
  expect(game.state.board).toEqual(initial.board);
  game.advance(12);
  game.pause(); game.advance(500); game.select(0);
  expect(game.state.remaining).toBe(288);
  expect(game.state.selected).toBe(different);
  game.resume(); game.advance(288);
  expect(game.state.phase).toBe('lost');
  game.select(0); game.resume(); game.advance(50);
  expect(game.state.phase).toBe('lost');
  expect(game.state.remaining).toBe(0);
  game.start();
  expect(game.state.remaining).toBe(300);
  expect(game.state.phase).toBe('playing');
  game.home(); game.advance(500);
  expect(game.state.phase).toBe('home');
});

test('同一初始样本复用：最后合法配对在超时前接受后通关，动画不改判且结果锁定', () => {
  const game = new Game({ random: random(INITIAL_SEEDS[1]!) });
  game.start();
  const solution = game.state.solution;
  for (const [first, second] of solution.slice(0, -1)) {
    game.select(first); game.select(second); game.advance(0.2);
  }
  game.advance(game.state.remaining - 0.01);
  const [first, second] = solution.at(-1)!;
  game.select(first); game.select(second);
  expect(game.state.phase).toBe('won');
  const time = game.state.remaining;
  game.advance(500); game.select(first); game.resume();
  expect(game.state.phase).toBe('won');
  expect(game.state.remaining).toBe(time);
  expect(game.state.board.every(fruit => fruit === null)).toBe(true);
});

test('调用方读取棋盘与回放顺序不会改变对局', () => {
  const game = new Game({ random: random(INITIAL_SEEDS[2]!) });
  game.start();
  const state = game.state;
  state.board.fill(null);
  state.solution[0]![0] = -1;
  expect(game.state.board.filter(fruit => fruit !== null)).toHaveLength(16);
  expect(game.state.solution[0]![0]).toBeGreaterThanOrEqual(0);
});
