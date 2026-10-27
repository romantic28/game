# 验证资料归属

本目录保留验证入口说明。可执行验证源脚本目前在外层 `tools/test-*.cjs`；它们依赖外层 references、制作工具和本机Laya安装，不是本仓库内可独立运行的测试套件。

历史此目录的 animation.cjs、rules.cjs 等实际是esbuild生成的模块，不是验证源，已保留到外层 archive/DEV-0072-project-organization/generated-tests。旧 PASS JSON只描述当时执行，不作为当前测试结果。

现有外层验证脚本已同步新模块入口，后续生成物统一写入 `tests/generated/` 并被ignore。本轮未运行这些游戏测试；旧视图替身与断言有版本滞后风险，不能据路径修正宣称适配当前GPU或动作行为。用户要求恢复测试时，应先检查替身和断言与当前实现一致，再执行。

结构／UUID／引用可在外层执行 `node tools/check-project-structure.cjs`；这是静态检查，不执行游戏或类型检查。运行和真实视觉仍需Laya IDE重新编译预览确认。
