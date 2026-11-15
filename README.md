# 水果连连看

使用 **Cocos Creator 3.8.8（3.8 LTS）+ TypeScript** 开发微信小游戏，浏览器用于日常预览。技术选型见 [ADR 0002](docs/adr/0002-cocos-creator-3-8-lts.md)，领域用语见 [GLOSSARY.md](GLOSSARY.md)，首期玩法规格见 [Issue #1](https://github.com/DCZJtAWhH/link-game/issues/1)。旧规格中的原生 Canvas 2D 与手工平台适配方案由 ADR 0002 取代。

当前实现 [Issue #2](https://github.com/DCZJtAWhH/link-game/issues/2) 的第 1 关可玩单局：首页开始、随机 4×4 棋盘、合法连线与原位消除、300 秒倒计时、超时重试及暂停恢复。暂用四种有文字和颜色区别的水果图案；40 关、道具、长期进度、正式素材与音频由后续阶段补齐。

## 环境要求

| 工具 | 固定版本与用途 |
| --- | --- |
| Cocos Creator | 3.8.8，场景、资源、浏览器／微信构建；版本记录在 `package.json` 的 `creator.version` |
| Node.js | 24.21.0，运行 pnpm 与辅助脚本，见 `.node-version` |
| pnpm | 12.9.1，安装辅助依赖，见 `packageManager` 与 `pnpm-lock.yaml` |

Creator 使用自己附带的运行环境，系统 Node 用于工程辅助命令。无需自建服务端、数据库或 Docker。下载入口：[Cocos 官方下载页](https://www.cocos.com/creator-download)、[3.8.8 Windows 官方安装包](https://download.cocos.com/CocosCreator/v3.8.8/CocosCreator-v3.8.8-win-121518.zip)。

本机编辑器已安装到 `D:\app\CocosCreator\3.8.8\CocosCreator.exe`，并配置好忽略提交的 `.cocos-local.json`。安装包与编辑器不放进 Git 仓库。

## 本地启动

本机直接运行：

```powershell
pnpm install --frozen-lockfile
pnpm cocos:doctor
pnpm dev
```

`pnpm dev` 打开 Creator 工程。首次导入需要生成资源库和引擎类型；在资源管理器中双击 `assets/scenes/Main.scene`，使用编辑器顶部的浏览器预览按钮运行。场景采用 360×640 竖屏设计，等比完整显示，额外空间留边；支持鼠标和触摸。

在新机器上，先安装 Creator 3.8.8、Node 与 pnpm，再配置编辑器路径：

```powershell
Copy-Item .cocos-local.example.json .cocos-local.json
```

修改 `.cocos-local.json` 中的 `editor` 为本机完整路径，或设置优先级更高的环境变量：

```powershell
$env:COCOS_CREATOR = 'D:\app\CocosCreator\3.8.8\CocosCreator.exe'
```

未安装 pnpm 时，可执行 `npm install --global pnpm@12.9.1`。依赖统一使用 pnpm，提交锁文件，避免另行生成 npm 或 Yarn 锁文件。

## 检查与构建

| 命令 | 用途 |
| --- | --- |
| `pnpm cocos:doctor` | 检查编辑器路径，显示要求的版本与引擎类型配置状态 |
| `pnpm dev` | 打开 Creator 编辑器 |
| `pnpm build:browser` | 用 Creator 构建 Web Mobile，输出 `build/web-mobile/` |
| `pnpm preview` | 在 <http://127.0.0.1:4173> 预览已构建的浏览器产物 |
| `pnpm build:wechat` | 用 Creator 构建微信小游戏，输出 `build/wechatgame/` |
| `pnpm build` | 顺序构建两端 |
| `pnpm typecheck` | 严格检查引擎脚本与辅助工具代码 |
| `pnpm test` / `pnpm test:watch` | 通过公开 `Game` 入口检查首档 3 个固定初始样本及复用它们的时间／状态行为 |
| `pnpm check` | 检查编辑器路径、构建两端、类型检查、运行测试入口 |

`pnpm check` 先构建再检查类型，因此新检出的工程也能生成 `temp/tsconfig.cocos.json` 和引擎声明。单独运行 `pnpm typecheck` 前，需至少用 Creator 打开或构建过一次工程；不要手写或提交 `temp/` 下的引擎声明。

命令行构建前关闭同一工程的编辑器窗口，避免资源库被并发占用。首次构建需要生成引擎缓存，耗时较长。完整进程日志在 `temp/creator-<平台>.log`，构建日志在 `temp/build-<平台>.log`。Creator 用退出码 **36** 表示构建成功，辅助脚本会转换成正常成功退出；非成功退出码会让 pnpm 命令失败。[官方命令行说明](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-in-command-line.html)

Vite 只用于静态产物预览和 Vitest 的工具依赖；游戏编译与平台构建统一交给 Creator。`build-config/` 保存可复用的平台构建配置，不使用旧的 Vite 游戏入口或 esbuild 微信打包脚本。

## 微信小游戏工程

`pnpm build:wechat` 生成的 `build/wechatgame/` 包含 `game.js`、`game.json`、`project.config.json` 及引擎、场景资源。

后续需要在微信开发者工具中打开时，选择“小游戏”，导入该目录，填写自己的小游戏 AppID。当前构建配置保留空 AppID；辅助脚本会清除 Creator 自动补入的示例 AppID。基础环境构建不需要提供 AppID，空 AppID 不代表可以登录或运行微信模拟器。

需要长期使用某个 AppID 时，调整微信构建配置；AppID 不是 AppSecret，**AppSecret 和账号凭据不放进客户端工程**。`build/` 是生成目录，重建会覆盖同名文件；持久配置修改 `build-config/wechatgame.json`，而不是只改生成文件。

微信工程目前仅做构建检查，**微信开发者工具与真机运行尚未验证**。

## 单局试玩与样本检查

构建后运行 `pnpm preview`，点击“开始挑战”。点选相同水果，连线需横纵行进、最多两次转弯，允许经过棋盘外围的一圈空白。重复点选取消，误配会短暂提示并选择后一个图块；暂停或切到后台会遮住棋盘，返回后点击“继续挑战”。清盘可再玩一局，超时可重试，返回首页不保留棋盘。

`pnpm test` 使用固定种子 11、29、47，只有这 3 个第 1 难度档初始棋盘。通过 `Game.start/select/advance/state` 检查尺寸、16 个图块、4 种水果、偶数数量，并将构造时保留的清盘顺序作为正常点击输入回放至空。暂停、错误点击、重试、超时锁定及最后配对跨过动画时间的检查均复用这组样本，不扩大随机样本池。逻辑测试不依赖 Creator 生成文件；引擎类型检查仍需先构建。

手机真机、微信开发者工具模拟器及微信真机均未验收；微信构建成功仅表示工程产物已生成。

本阶段实际通过 `pnpm test`（4 项检查）、`pnpm typecheck`、`pnpm build:browser` 和 `pnpm build:wechat`。Chrome 360×640 竖屏复用种子 11 检查了鼠标开始与合法消除、触摸暂停与恢复、暂停期间时间保持不变，未发现脚本异常或游戏资源加载失败。

## 目录与开发边界

```text
assets/scenes/Main.scene       主场景
assets/scripts/SetupScene.ts   Cocos 显示、输入及前后台暂停适配
assets/scripts/core/Game.ts    唯一主要玩法公开边界
assets/scripts/core/board.ts   内部路径与构造式生成，不直接作为测试入口
settings/v2/packages/         项目设置与 2D 引擎模块配置
build-config/                 Web Mobile 与微信构建配置
scripts/cocos.mjs             编辑器定位、启动与构建命令
tests/game.test.ts            3 个初始棋盘样本与单局行为检查
docs/adr/                     架构决策
```

玩法逻辑保持为独立 TypeScript 模块，不直接调用 `cc`、DOM 或 `wx`；Creator 组件负责显示与输入，Vitest 通过玩法公开入口检查行为。游戏资源与脚本的 `.meta` 必须和对应文件一起提交，保持 UUID 稳定。[官方项目结构说明](https://docs.cocos.com/creator/3.8/manual/zh/getting-started/project-structure/index.html)

`build/`、`library/`、`temp/`、`local/`、`profiles/`、`node_modules/` 与 `.cocos-local.json` 都是本机或生成内容，已加入忽略规则。
