# 水果连连看

基于 TypeScript 与 Canvas 2D 的微信小游戏，浏览器用于本地预览，两端共用绘制和后续玩法逻辑。方案见 [ADR 0001](docs/adr/0001-typescript-canvas-shared-gameplay.md)，领域用语见 [GLOSSARY.md](GLOSSARY.md)，完整需求见 [Issue #1](https://github.com/DCZJtAWhH/link-game/issues/1)。

当前只完成本地环境和最小工程：画布显示“本地环境已就绪”，点击或触摸后显示“输入正常”。尚未实现棋盘、配对、关卡或道具；这不代表 [Issue #2](https://github.com/DCZJtAWhH/link-game/issues/2) 的可玩单局已经交付。

## 本地启动

使用 Node.js 24.21.0（`.node-version`）与 pnpm 12.9.1（`package.json`）。`engines` 限定 Node 24.x 与 pnpm 12.x 的兼容范围，项目依赖精确版本及其解析结果记录在 `package.json` 和 `pnpm-lock.yaml`。本项目无需服务端、数据库、Docker、环境变量或微信 AppID 即可进行浏览器开发与两端构建。

若已有 pnpm 12.9.1，直接执行：

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://127.0.0.1:5173>。页面居中显示竖屏画布，支持鼠标与触摸；`Ctrl+C` 停止服务。端口被占用时会报错，可用 `pnpm dev --port 5174` 指定其他端口。

未安装 pnpm 时，可先使用本机 Node 附带的 npm 安装：

```powershell
npm install --global pnpm@12.9.1
```

项目依赖统一通过 pnpm 管理，提交 `pnpm-lock.yaml`，不要另行生成 npm 或 Yarn 锁文件。`pnpm-workspace.yaml` 在此用于 pnpm 配置，不代表项目拆分为多个包；其中允许 esbuild 执行安装脚本。

## 检查和构建

| 命令 | 用途 |
| --- | --- |
| `pnpm typecheck` | 分别检查浏览器、微信和构建／测试代码，均启用 TypeScript 严格模式 |
| `pnpm test` | 运行 Vitest 的微信构建冒烟测试 |
| `pnpm test:watch` | 开发时持续运行测试 |
| `pnpm build:browser` | 输出浏览器静态产物到 `dist/browser/` |
| `pnpm preview` | 在 <http://127.0.0.1:4173> 预览已构建的浏览器产物 |
| `pnpm build:wechat` | 输出微信小游戏工程到 `dist/wechat/` |
| `pnpm build` | 构建两端 |
| `pnpm check` | 依次执行类型检查、测试和两端构建 |

微信测试实际运行 esbuild，在临时目录检查工程配置，再以模拟的 `wx` 接口启动 `game.js`，检查画布初始化和触摸入口。模拟环境没有浏览器 DOM；该测试不等同于微信开发者工具或真机验证。当前没有玩法逻辑，尚无棋盘样本检查；该检查随后续玩法开发接入。

浏览器冒烟检查：看到“本地环境已就绪”；点击后看到“输入正常”；缩窄窗口或使用手机触摸时画布保持竖屏、内容可见；控制台无脚本错误。构建后可用 `pnpm preview` 重复检查静态产物。

本次搭建已通过 `pnpm install --frozen-lockfile`、`pnpm check`，以及 Chrome 无头浏览器对开发入口和构建预览的鼠标、移动视口触摸检查；检查确认画布实际绘制、输入后重新绘制、竖屏内容未溢出，并且没有脚本异常或资源加载失败。移动视口模拟不等同于手机真机测试。

## 微信工程

`pnpm build:wechat` 生成：

```text
dist/wechat/
  game.js
  game.js.map
  game.json
  project.config.json
```

需要后续使用微信开发者工具时，选择“小游戏”，导入 `dist/wechat/`，填写你自己的小游戏 AppID。模板故意保留空 AppID；本次不要求账号或 AppID，也不承诺无 AppID 可启动模拟器。工具可能要求选择可用的基础库版本；入口使用 `wx.getWindowInfo`，根据微信官方类型定义需基础库 2.25.3 或以上，详见 [微信官方 API 文档](https://developers.weixin.qq.com/minigame/dev/api/base/system/wx.getWindowInfo.html)。

`dist/` 为生成目录，重新构建会覆盖同名文件，包括 `project.config.json`。需要持久调整时修改 `platform/wechat/` 中的模板；个人 AppID、登录信息和 `project.private.config.json` 不提交到仓库。

本阶段只验证产物构建及模拟环境冒烟，**微信开发者工具、微信真机运行尚未验证**。

## 目录约定

```text
src/shared/              平台无关的最小绘制入口；后续共用玩法放在这里
src/platforms/browser/  浏览器画布、输入与页面样式
src/platforms/wechat/   微信画布与触摸输入
platform/wechat/        微信工程配置模板
scripts/                构建脚本
tests/                  构建冒烟测试；后续扩展玩法测试
docs/adr/               已接受的架构决策
```

共享代码不直接使用 `window`、`document` 或 `wx`，平台接口由各自入口接入。微信类型检查不引入 DOM 类型；为浏览器新增功能后仍需运行 `pnpm check`，确认没有把平台依赖带入共用代码。
