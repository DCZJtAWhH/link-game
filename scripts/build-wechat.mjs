import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));

/** @param {string} [outdir] */
export async function buildWechat(outdir = resolve(root, 'dist/wechat')) {
  await mkdir(outdir, { recursive: true });
  await build({
    absWorkingDir: root,
    entryPoints: ['src/platforms/wechat/main.ts'],
    outfile: resolve(outdir, 'game.js'),
    bundle: true,
    platform: 'neutral',
    format: 'iife',
    target: 'es2018',
    sourcemap: true,
    tsconfig: 'tsconfig.wechat.json',
  });
  for (const name of ['game.json', 'project.config.json']) {
    await copyFile(resolve(root, 'platform/wechat', name), resolve(outdir, name));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildWechat();
  console.log('微信构建完成：dist/wechat（未验证微信运行）');
}
