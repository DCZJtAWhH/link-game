import { expect, test } from 'vitest';
import { Game } from '../assets/scripts/core/Game';

// Together with game.test.ts: 12 initial samples, exactly three per difficulty tier.
const INITIAL_SEEDS = [11, 29, 47];
const TIERS = [
  { level: 1, columns: 4, rows: 4, types: 4 },
  { level: 6, columns: 4, rows: 6, types: 6 },
  { level: 11, columns: 6, rows: 6, types: 8 },
  { level: 21, columns: 6, rows: 8, types: 10 },
];
function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function storage(level = 1) {
  let saved: unknown = { currentLevel: level };
  return { load: () => saved, save: (value: unknown) => { saved = value; } };
}
function clear(game: Game): void {
  for (const [first, second] of game.state.solution) {
    game.select(first); game.select(second);
    expect(game.state.feedback?.kind).toBe('match');
    game.advance(0.2);
  }
  expect(game.state.phase).toBe('won');
  expect(game.state.board.every(fruit => fruit === null)).toBe(true);
}

test('其余三档各3个初始样本尺寸、水果类型和偶数数量正确，公开操作可完整清盘', () => {
  for (const tier of TIERS.slice(1)) for (const seed of INITIAL_SEEDS) {
    const game = new Game({ random: random(seed), storage: storage(tier.level) });
    game.start();
    const state = game.state;
    expect([state.level, state.columns, state.rows]).toEqual([tier.level, tier.columns, tier.rows]);
    expect(state.board).toHaveLength(tier.columns * tier.rows);
    expect(state.remaining).toBe(300);
    const counts = new Map<number, number>();
    state.board.forEach(fruit => { if (fruit !== null) counts.set(fruit, (counts.get(fruit) ?? 0) + 1); });
    expect(counts.size).toBe(tier.types);
    expect([...counts.values()].every(count => count % 2 === 0)).toBe(true);
    clear(game);
  }
});

test('通关立即保存下一关，失败或退出不倒退，重开只恢复长期进度', () => {
  const store = storage();
  const game = new Game({ random: random(11), storage: store });
  game.start();
  const solution = game.state.solution;
  for (const [first, second] of solution.slice(0, -1)) {
    game.select(first); game.select(second); game.advance(0.2);
  }
  const last = solution.at(-1)!;
  game.select(last[0]); game.select(last[1]);
  // Persistence happens at acceptance, before a result animation or next-level click.
  expect(new Game({ storage: store }).state.progress.currentLevel).toBe(2);
  game.home();
  game.start();
  expect(game.state.level).toBe(2);
  game.advance(300);
  expect(game.state.phase).toBe('lost');
  expect(game.state.progress.currentLevel).toBe(2);
  const reopened = new Game({ random: random(11), storage: store });
  expect(reopened.state.phase).toBe('home');
  reopened.start();
  expect(reopened.state.remaining).toBe(300);
  expect(reopened.state.board.filter(fruit => fruit !== null)).toHaveLength(16);
});

test('通过第40关保存本期完成，返回及重玩不生成第41关或丢失完成标记', () => {
  const store = storage(40);
  const game = new Game({ random: random(47), storage: store });
  game.start(); clear(game);
  expect(game.state.progress).toMatchObject({ currentLevel: 40, completed: true });
  game.home();
  const reopened = new Game({ random: random(47), storage: store });
  expect(reopened.state.progress).toMatchObject({ currentLevel: 40, completed: true });
  reopened.start(); reopened.advance(300); reopened.start();
  expect(reopened.state.level).toBe(40);
  expect(reopened.state.progress.completed).toBe(true);
});

test('同池初始样本复用：提示仅标出合法对，加时实际生效才扣次数，新一局恢复配额', () => {
  const game = new Game({ random: random(29) });
  expect(game.useTool('hint')).toBe(false);
  expect(game.useTool('time')).toBe(false);
  game.start();
  const before = game.state.board;
  expect(game.state.tools).toEqual({ hint: 2, shuffle: 1, time: 1 });
  expect(game.useTool('hint')).toBe(true);
  expect(game.state.board).toEqual(before);
  expect(game.state.tools.hint).toBe(1);
  const hint = game.state.hint!;
  game.advance(1);
  expect(game.state.remaining).toBe(299);
  game.select(hint[0]); game.select(hint[1]);
  expect(game.state.feedback?.kind).toBe('match');
  expect(game.state.hint).toBeNull();
  game.advance(0.2);
  expect(game.useTool('time')).toBe(true);
  expect(game.state.remaining).toBeCloseTo(318.8);
  expect(game.useTool('time')).toBe(false);
  game.pause();
  expect(game.useTool('hint')).toBe(false);
  expect(game.state.tools.hint).toBe(1);
  game.resume(); game.advance(400);
  expect(game.useTool('hint')).toBe(false);
  expect(game.useTool('shuffle')).toBe(false);
  game.start();
  expect(game.state.tools).toEqual({ hint: 2, shuffle: 1, time: 1 });
  expect(game.state.hint).toBeNull();
  expect(game.state.remaining).toBe(300);
});

// The only twelve reshuffle samples; system checks below reuse this same pool.
const SHUFFLE_SEEDS = [101, 103, 107];
test('四档各3个有空位重排样本保留空位、水果、时间，扣主动次数并完整清盘', () => {
  for (const tier of TIERS) for (const seed of SHUFFLE_SEEDS) {
    const game = new Game({ random: random(seed), storage: storage(tier.level) });
    game.start();
    for (const [first, second] of game.state.solution.slice(0, 2)) {
      game.select(first); game.select(second); game.advance(0.2);
    }
    game.advance(3);
    game.useTool('hint'); game.select(game.state.hint![0]);
    const before = game.state;
    const fruits = (board: (number | null)[]) => board.filter(fruit => fruit !== null).sort();
    const holes = (board: (number | null)[]) => board.map((fruit, index) => fruit === null ? index : -1).filter(index => index >= 0);
    expect(game.useTool('shuffle')).toBe(true);
    expect(game.state.phase).toBe('reshuffling');
    expect(game.state.selected).toBeNull();
    expect(game.state.hint).toBeNull();
    expect(fruits(game.state.board)).toEqual(fruits(before.board));
    expect(holes(game.state.board)).toEqual(holes(before.board));
    expect(game.state.remaining).toBe(before.remaining);
    expect(game.state.tools).toEqual({ ...before.tools, shuffle: 0 });
    game.select(game.state.solution[0]![0]);
    expect(game.state.selected).toBeNull();
    game.advance(0.4);
    expect(game.state.phase).toBe('playing');
    expect(game.state.remaining).toBe(before.remaining);
    expect(game.useTool('shuffle')).toBe(false);
    clear(game);
  }
});

test('复用4×6/101重排样本：正常消除进入无合法对后系统免费重排，停表且不扣任何道具', () => {
  const game = new Game({ random: random(101), storage: storage(6) });
  game.start();
  // Fixed legal prefix on the same approved sample, rather than injected board state.
  const prefix = [[1, 2], [5, 6], [4, 7], [0, 11], [3, 16], [8, 9], [10, 12], [20, 22]];
  for (const [first, second] of prefix.slice(0, -1)) {
    game.select(first!); game.select(second!);
    expect(game.state.feedback?.kind).toBe('match');
    game.advance(0.2);
  }
  const before = game.state;
  const [first, second] = prefix.at(-1)!;
  const expected = before.board.map((fruit, index) => index === first || index === second ? null : fruit);
  game.select(first!); game.select(second!); game.advance(0.16);
  expect(game.state.phase).toBe('reshuffling');
  expect(game.state.reshuffleReason).toBe('system');
  expect(game.state.board.map(fruit => fruit === null)).toEqual(expected.map(fruit => fruit === null));
  expect(game.state.board.filter(fruit => fruit !== null).sort()).toEqual(expected.filter(fruit => fruit !== null).sort());
  expect(game.state.tools).toEqual(before.tools);
  expect(game.state.remaining).toBeCloseTo(before.remaining - 0.16);
  const time = game.state.remaining;
  game.advance(0.2);
  expect(game.state.remaining).toBe(time);
  game.advance(0.2);
  expect(game.state.phase).toBe('playing');
  expect(game.state.remaining).toBe(time);
  clear(game);
});

test('后续引导与音频偏好通过同一公开边界保存，读取快照不能篡改进度或道具', () => {
  const store = storage();
  const game = new Game({ random: random(47), storage: store });
  game.updatePreferences({ tutorialSeen: true, music: false, effects: false });
  const reopened = new Game({ storage: store });
  expect(reopened.state.progress).toEqual({ currentLevel: 1, completed: false, tutorialSeen: true, music: false, effects: false });
  game.start();
  const state = game.state;
  state.progress.currentLevel = 40; state.tools.hint = 99;
  expect(game.state.progress.currentLevel).toBe(1);
  expect(game.state.tools.hint).toBe(2);
});
