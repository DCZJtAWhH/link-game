# 水果连连看

使用 **Cocos Creator 3.8.8（3.8 LTS）+ TypeScript** 开发微信小游戏，浏览器用于日常预览。技术选型见 [ADR 0002](docs/adr/0002-cocos-creator-3-8-lts.md)，领域用语见 [GLOSSARY.md](GLOSSARY.md)，首期玩法规格见 [Issue #1](https://github.com/DCZJtAWhH/link-game/issues/1)。旧规格中的原生 Canvas 2D 与手工平台适配方案由 ADR 0002 取代。

当前实现 [Issue #2](https://github.com/DCZJtAWhH/link-game/issues/2) 与 [Issue #3](https://github.com/DCZJtAWhH/link-game/issues/3)：40 关顺序挑战、合法连线与原位消除、300 秒倒计时、超时重试、暂停恢复、提示／重排／加时、系统免费重排及本地长期进度。暂用最多十种有文字和颜色区别的水果图案；正式素材、引导和实际音频由下一阶段补齐。

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

## 闯关试玩与样本检查

构建后运行 `pnpm preview`，首页显示当前关卡，点击“开始挑战”。点选相同水果，连线需横纵行进、最多两次转弯，允许经过棋盘外围的一圈空白。重复点选取消，误配会短暂提示并选择后一个图块；暂停或切到后台会遮住棋盘，返回后点击“继续挑战”。清盘后可进入下一关，超时可重试。通过第 40 关显示本期完成，可重玩第 40 关，不创建第 41 关。

每局提示 2 次、主动重排 1 次、加时 1 次（+20 秒），新的一局恢复固定配额。提示只标出一组合法配对，需自行点击；重排保留空位和剩余水果。没有合法配对时系统自动免费重排，两类重排期间均停表并锁定点击。道具按钮显示剩余次数。

| 关卡 | 棋盘（列×行） | 图块数 | 水果类型数 | 初始时间 |
| --- | --- | --- | --- | --- |
| 1～5 | 4×4 | 16 | 4 | 300 秒 |
| 6～10 | 4×6 | 24 | 6 | 300 秒 |
| 11～20 | 6×6 | 36 | 8 | 300 秒 |
| 21～40 | 6×8 | 48 | 10 | 300 秒 |

本地键 `fruit-link.progress.v1` 仅保存当前关卡、本期完成标记及后续引导／音频偏好；不保存未完成棋盘。通关接受最后一对时立即保存下一关，失败、返回首页或重启不倒退；下一次进入重新生成当前关卡并恢复时间和道具次数。浏览器与微信经 Cocos 的 `sys.localStorage` 适配，数据不会跨设备同步；清理本地数据后从第 1 关重新开始。[Cocos 存储说明](https://docs.cocos.com/creator/3.8/manual/zh/advanced-topics/data-storage.html)

`pnpm test` 仅有 **24 个棋盘样本**：四档分别使用种子 11、29、47 的 3 个初始样本（12 个），以及种子 101、103、107 的 3 个有空位重排样本（12 个）。通过 `Game.start/select/advance/useTool/state` 检查尺寸、总图块、水果类型、偶数数量，并将保留的清盘顺序作为正常点击输入回放至空。所有重排样本检查空位、水果多重集合、剩余时间和主动扣次；系统免费重排复用其中的 4×6／101 样本，通过固定合法消除前缀自然触发，检查停表、不扣次数并回放清盘。计时、暂停、结果、道具和存档检查复用同一池，不扩大随机样本池，不伪造剩余棋盘或直接测试内部算法。逻辑测试不依赖 Creator 生成文件；引擎类型检查仍需先构建。

手机真机、微信开发者工具模拟器及微信真机均未验收；微信构建成功仅表示工程产物已生成。

本阶段实际通过 `pnpm test`（11 项检查）、`pnpm typecheck`、`pnpm build:browser` 和 `pnpm build:wechat`。Chrome 360×640 竖屏复用第 21 关／种子 11 检查了从保存关卡开始、6×8 鼠标合法消除、触摸三个道具、暂停停表及恢复；经公开玩法入口清盘后立即保存第 22 关，刷新仍停留第 22 关首页。未发现脚本异常或游戏资源加载失败。

## 目录与开发边界

```text
assets/scenes/Main.scene       主场景
assets/scripts/SetupScene.ts   Cocos 显示、输入及前后台暂停适配
assets/scripts/core/Game.ts    唯一主要玩法公开边界
assets/scripts/core/board.ts   内部路径与构造式生成，不直接作为测试入口
assets/scripts/core/levels.ts  40 关配置
assets/scripts/core/progress.ts 长期进度格式与有效范围
assets/scripts/platform/Storage.ts Cocos 本地存储适配
settings/v2/packages/         项目设置与 2D 引擎模块配置
build-config/                 Web Mobile 与微信构建配置
scripts/cocos.mjs             编辑器定位、启动与构建命令
tests/game.test.ts            3 个初始棋盘样本与单局行为检查
tests/progression.test.ts     其余 9 个初始、12 个重排样本及闯关／道具／存档检查
docs/adr/                     架构决策
```

玩法逻辑保持为独立 TypeScript 模块，不直接调用 `cc`、DOM 或 `wx`；Creator 组件负责显示与输入，Vitest 通过玩法公开入口检查行为。游戏资源与脚本的 `.meta` 必须和对应文件一起提交，保持 UUID 稳定。[官方项目结构说明](https://docs.cocos.com/creator/3.8/manual/zh/getting-started/project-structure/index.html)

`build/`、`library/`、`temp/`、`local/`、`profiles/`、`node_modules/` 与 `.cocos-local.json` 都是本机或生成内容，已加入忽略规则。
