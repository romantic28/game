# 染色玩法开发工程

项目名称待定。运行画面和浏览器页签使用“染色玩法开发预览”；`MonsterParty.laya` 是现有工程文件标识，暂时保留，避免已有 IDE 工作区和打开路径失效。

引擎固定 **LayaAir 3.2.9**，纯 2D、TypeScript。当前分支 `codex/v0.2-character-sample`。

## 打开与运行

使用 LayaAir 3.2.9 打开 `MonsterParty.laya`，等待资源和脚本导入，重新编译并预览。场景为 `assets/Scene.ls`，挂载脚本为 `src/Main.ts`；移动其他脚本时保留原 `.meta` UUID。旧 `bin/js` 不代表当前源码，整理后需要重新编译。

独立网页构建先在当前终端配置 `LAYA_RESOURCES`（本机Laya3.2.9的resources目录），再在外层项目目录执行 `node tools/build.cjs`，输出到 `game/browser/`。在外层设置 `$env:PORT=18083` 后执行 `node tools/serve.cjs`，访问 http://127.0.0.1:18083 。`bin/index.html` 是 IDE 模板，不能直接代替网页构建。

## 源码导航

编辑器如对 `moduleResolution: "node"` 提示TypeScript6弃用，请打开任一 `.ts`，执行 `TypeScript: Select TypeScript Version` → `Use Workspace Version`，使用Laya配套4.9.5。工程 `.vscode/settings.json` 使用项目相对路径 `node_modules/typescript/lib`。先在本机环境配置 `LAYA_RESOURCES`（Laya3.2.9的resources目录），再从外层执行 `node tools/setup-editor-sdk.cjs` 准备本地SDK；node_modules被ignore，换机需重新准备。仅设置tsdk不会自动切换当前编辑器版本，不要为消警改成TS6专用配置。

- `src/Main.ts`：唯一场景脚本入口，加载资源、挂载和销毁。
- `src/app/`：舞台挂载、竖屏适配。
- `src/gameplay/`：引擎无关的类型、染色规则和样板布局。
- `src/board/`：棋盘界面、输入与表现时序、纯格子外观。
- `src/effects/`：冻结区域内的接力安排、遮罩波前几何。
- `src/characters/`：共享资源／表情、GPU与遮罩两种绘制、角色动作。

职责与修改约定见 [工程结构与维护约定](docs/工程结构与维护约定.md)。当前能力及验收边界见 [V0.2角色样板](docs/V0.2角色样板.md)，玩法约束见 [染色规则基线](docs/染色规则基线.md)。

## 当前能力

三物种四色、GPU／遮罩染色、原区域染色接力、轻量回弹及原目标色邻队回应。三物种日常／开心表情已制作接入（用户已表示制作完成）；样板与8×10密集排布均可操作，保留纯格子对照、选色、撤销、重来和胜负。

表情制作完成不代表全部布局或手机性能已验收；最新共享边接力观感、密集表现与性能仍待用户反馈，不自动推进下一阶段。历史 [V0.1交付说明](docs/V0.1交付说明.md) 仅描述当时状态。

## 文件归属

`assets/` 保存运行素材和场景，连同 `.meta` 维护；`settings/` 是项目配置；`engine/` 是引擎声明，`packages/` 是插件目录，`templateInfo/` 是初始模板信息。

`library/`、`local/` 为 IDE 缓存／本机布局，`bin/js/`、`bin/libs/`、`browser/` 和 `tests/generated/` 为生成物。不要手改生成代码；部分历史文件已被 Git 跟踪，新增 ignore 规则不会把它们自动移出索引，本轮未改 Git 索引或清除本机缓存。

`tests/README.md` 说明验证脚本与生成物的归属；本轮没有运行游戏测试、类型检查、IDE编译或真实播放。构建和静态检查不代表播放／视觉验收。

提交前的保留／忽略范围与历史生成物索引清理命令见 [提交文件范围](docs/提交文件范围.md)。用户自行提交推送，ignore不会自动停止跟踪已有文件。

外层 `docs/`、`art/`、`tools/`、`archive/` 分别保存开发资料、美术源、制作／构建工具、历史归档。开发版本记录只在外层本地维护，不复制进本仓库。提交、推送和发布按当次授权执行。

## 角色接入规范

角色定义已集中至src/characters/CharacterDefinitions.ts，运行与外层生产工具共同读取；制作输入在外层tools/character-sources.json。新增角色流程、固定画布／图层约束、加载与关卡边界见[角色定义与素材接入](docs/角色定义与素材接入.md)。
