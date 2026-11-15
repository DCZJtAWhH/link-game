import { access, readFile, mkdir, open, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const project = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

async function findEditor() {
  /** @type {{ editor?: string }} */
  let local = {};
  try {
    local = JSON.parse((await readFile(resolve(root, '.cocos-local.json'), 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }
  const editor = process.env.COCOS_CREATOR || local.editor;
  if (!editor || typeof editor !== 'string') {
    throw new Error('请在 .cocos-local.json 中设置 editor，或设置 COCOS_CREATOR 为 CocosCreator 可执行文件路径。详见 README。');
  }
  const executable = resolve(root, editor);
  await access(executable, constants.F_OK);
  return executable;
}

/** @param {string} executable @param {string[]} args @param {string} [logFile] */
async function runEditor(executable, args, logFile) {
  const log = logFile ? await open(logFile, 'w') : null;
  let code;
  try {
    const child = spawn(executable, args, {
      cwd: root,
      stdio: log ? ['ignore', log.fd, log.fd] : 'inherit',
      windowsHide: Boolean(log),
    });
    code = await new Promise((resolveCode, reject) => {
      child.once('error', reject);
      child.once('exit', (exitCode, signal) => {
        if (signal) reject(new Error(`Creator 被信号 ${signal} 中断`));
        else resolveCode(exitCode);
      });
    });
  } finally {
    await log?.close();
  }
  // Creator uses 36 for successful command-line builds, not the usual 0.
  if (code !== (logFile ? 36 : 0)) {
    throw new Error(`Creator ${logFile ? '构建' : '运行'}失败，退出码 ${code}。${logFile ? `日志：${logFile}` : ''}`);
  }
}

try {
  const editor = await findEditor();
  const command = process.argv[2] || 'doctor';
  if (command === 'doctor') {
    console.log(`项目要求 Cocos Creator ${project.creator.version}`);
    console.log(`编辑器：${editor}`);
    try {
      await access(resolve(root, 'temp/tsconfig.cocos.json'));
      console.log('引擎类型配置已生成。');
    } catch {
      console.log('首次打开或构建工程后会生成引擎类型配置。');
    }
  } else if (command === 'open') {
    await runEditor(editor, ['--project', root]);
  } else if (command === 'build') {
    const platform = process.argv[3];
    if (platform !== 'web-mobile' && platform !== 'wechatgame') {
      throw new Error('构建平台仅支持 web-mobile 或 wechatgame');
    }
    const log = resolve(root, 'temp', `build-${platform}.log`);
    await mkdir(dirname(log), { recursive: true });
    await writeFile(log, '');
    console.log(`正在构建 ${platform}，首次构建需要生成引擎缓存。日志：${log}`);
    await runEditor(editor, [
      '--project', root,
      '--build', `configPath=${resolve(root, 'build-config', `${platform}.json`)};logDest=${log}`,
    ], resolve(root, 'temp', `creator-${platform}.log`));
    const entry = platform === 'web-mobile' ? 'index.html' : 'game.js';
    await access(resolve(root, 'build', platform, entry));
    if (platform === 'wechatgame') {
      const configPath = resolve(root, 'build-config/wechatgame.json');
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      // Creator substitutes its sample AppID for an empty value; keep our template empty.
      if (!config.packages.wechatgame.appid) {
        const outputPath = resolve(root, 'build/wechatgame/project.config.json');
        const output = JSON.parse(await readFile(outputPath, 'utf8'));
        output.appid = '';
        await writeFile(outputPath, JSON.stringify(output, null, 2) + '\n');
        console.log('微信 AppID 留空，导入微信开发者工具时填写自己的小游戏 AppID。');
      }
    }
    console.log(`构建成功：build/${platform}/${entry}`);
  } else {
    throw new Error(`未知命令：${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
