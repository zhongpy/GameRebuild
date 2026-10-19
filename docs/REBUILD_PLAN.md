# 工作区推进计划

更新日期：2026-10-19（Asia/Shanghai）。

此仓维护通用规范、环境初始化与项目索引。游戏实施计划及特有规则归独立项目仓库，不作为工作区版本的一部分。

- 项目索引：[projects.json](../projects.json)。
- 环境模板：[environment.example.json](../environment.example.json)。
- 通用规范：[COCOS_WORKFLOW.md](COCOS_WORKFLOW.md)。
- 技术评估：[COCOS_ASSESSMENT.md](COCOS_ASSESSMENT.md)。

已建立工作区和两个项目的独立本地 Git 仓库，尚未设置远程；本地提交历史以各仓 git log 为准。两套原包移至 resources/；父仓库忽略原包、子仓库、本机配置及产物。首次环境检查和 Conda Python 创建脚本已建立。

本次验证：环境脚本 7 项测试通过；四个技能通过官方 Python 校验器；资源移动后 146/223 项清单哈希分别通过；三个 Git 根目录独立；本机配置、原包及子仓内容的父仓忽略规则通过；11 个本地文档链接有效。专用 Conda Python 环境已创建，当前静态环境检查全部通过；实际版本和路径保存在不入库的环境报告中。

初始试点仍暂定 Emergency Jam。其三端小场景、原版基线及源码重建计划在 projects/emergency-jam/docs/REBUILD_PLAN.md。Pegball 的计划在 projects/pegball-frvr/docs/REBUILD_PLAN.md。

新机器先生成本机环境配置，再分别克隆项目和放置资源。当前尚未执行 Cocos 素材导入、构建或真机验证。
