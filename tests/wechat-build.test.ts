import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { expect, test, vi } from 'vitest';
import { buildWechat } from '../scripts/build-wechat.mjs';

test('微信产物包含工程配置，并可在没有 DOM 的模拟环境中启动和接收触摸', async () => {
  const output = await mkdtemp(join(tmpdir(), 'link-game-wechat-'));
  try {
    await buildWechat(output);
    const config = JSON.parse(await readFile(join(output, 'project.config.json'), 'utf8'));
    expect(config.compileType).toBe('game');
    const gameConfig = JSON.parse(await readFile(join(output, 'game.json'), 'utf8'));
    expect(gameConfig.deviceOrientation).toBe('portrait');

    const context = {
      fillRect: vi.fn(), fillText: vi.fn(), translate: vi.fn(), scale: vi.fn(),
    };
    const canvas = { width: 0, height: 0, getContext: vi.fn(() => context) };
    let touch: (() => void) | undefined;
    const wx = {
      createCanvas: () => canvas,
      getWindowInfo: () => ({ windowWidth: 360, windowHeight: 640, pixelRatio: 2 }),
      onTouchStart: (callback: () => void) => { touch = callback; },
    };
    runInNewContext(await readFile(join(output, 'game.js'), 'utf8'), { wx }, { timeout: 1000 });
    expect([canvas.width, canvas.height]).toEqual([720, 1280]);
    expect(context.fillText).toHaveBeenCalledWith('本地环境已就绪', expect.any(Number), expect.any(Number));
    expect(touch).toBeTypeOf('function');
    touch?.();
    expect(context.fillText).toHaveBeenCalledWith('输入正常', expect.any(Number), expect.any(Number));
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
