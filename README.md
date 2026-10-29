# 怪兽变装派对

V0.1 已完成，用户已于 2026-10-26 明确审查通过。引擎固定 LayaAir 3.2.9，纯 2D、TypeScript。

本 Git 仓库根目录对应本机 `D:/overflow/monster-party/game`。

## 打开运行

使用 LayaAir 3.2.9 打开 `MonsterParty.laya`，编译并启动预览。入口场景为 `assets/Scene.ls`，启动组件为 `src/Main.ts`。

`bin/index.html` 是 IDE 专用模板，必须保留引擎库、bundleJS、indexJS 的模板占位符；独立网页不得覆盖它。

## 已实现

四颜色选择、任意原同色共边区域染色、目标色、有限步数、撤销、重来、成功失败、三个切换样板，以及身体可染、角与五官固定色的小角怪占位。染色接力和波前光效已提前接入。

## 文档

- [V0.1 交付与验收记录](docs/V0.1交付说明.md)
- [染色规则基线](docs/染色规则基线.md)


当前用户验收结论为 V0.1 通过；手机、小游戏平台及定量性能未声明通过。三种正式怪兽、合群欢呼、舞蹈、拍照和正式关卡扩量属于后续版本。

## 仓库边界

外层 `monster-party/docs`、`tools`、`references`、游戏方案与概念图目前不在本仓库中；本仓库只保留 LayaAir IDE 工程及交付文档。自动测试脚本仍在外层工具目录。


