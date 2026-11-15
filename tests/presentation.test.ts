import { expect, test } from 'vitest';
import { Game } from '../assets/scripts/core/Game';

function random(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

test('复用初始11样本：首次第1关三步图解期间停表，完成保存已读并开始挑战', () => {
  let saved: unknown;
  const store = { load: () => saved, save: (value: unknown) => { saved = value; } };
  const game = new Game({ random: random(11), storage: store });
  game.start();
  const initial = game.state;
  expect(initial.phase).toBe('tutorial');
  expect(initial.tutorialStep).toBe(0);
  game.advance(90); game.select(0);
  expect(game.state.remaining).toBe(300);
  expect(game.state.selected).toBeNull();
  game.nextTutorial();
  expect(game.state.tutorialStep).toBe(1);
  game.nextTutorial();
  expect(game.state.tutorialStep).toBe(2);
  game.nextTutorial();
  expect(game.state.phase).toBe('playing');
  expect(game.state.board).toEqual(initial.board);
  expect(new Game({ storage: store }).state.progress.tutorialSeen).toBe(true);
  game.advance(1);
  expect(game.state.remaining).toBe(299);
});


test('复用初始29样本：跳过后重试不再引导，暂停重看规则关闭后仍保持暂停', () => {
  const game = new Game({ random: random(29) });
  game.start(); game.skipTutorial();
  expect(game.state.progress.tutorialSeen).toBe(true);
  game.advance(12); game.pause();
  const before = game.state;
  game.showRules();
  expect(game.state.phase).toBe('tutorial');
  game.nextTutorial(); game.advance(100);
  game.skipTutorial();
  expect(game.state.phase).toBe('paused');
  expect(game.state.remaining).toBe(before.remaining);
  expect(game.state.board).toEqual(before.board);
  game.resume(); game.advance(1);
  expect(game.state.remaining).toBe(287);
  game.start();
  expect(game.state.phase).toBe('playing');
});
