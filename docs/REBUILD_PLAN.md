# 工作区推进计划

更新日期：2026-10-19（Asia/Shanghai）。

此仓维护通用规范、环境初始化与项目索引。游戏实施计划及特有规则归独立项目仓库，不作为工作区版本的一部分。

- 项目索引：[projects.json](../projects.json)。
- 环境模板：[environment.example.json](../environment.example.json)。
- 通用规范：[COCOS_WORKFLOW.md](COCOS_WORKFLOW.md)。
- 技术评估：[COCOS_ASSESSMENT.md](COCOS_ASSESSMENT.md)。

已建立工作区和两个项目的独立本地 Git 仓库，尚未设置远程；本地提交历史以各仓 git log 为准。两套原包移至 resources/；父仓库忽略原包、子仓库、本机配置及产物。首次环境检查和 Conda Python 创建脚本已建立。

环境脚本现有 8 项测试通过，新增微信开发者工具身份校验，避免把支付宝同名工具识别为微信工具；版本优先读取实际 IDE 包，避免把启动器版本当作 IDE 版本。专用 Conda Python 环境已创建，当前静态环境检查全部通过；实际版本和路径保存在不入库的环境报告中。

此前验证：四个技能通过官方 Python 校验器；资源移动后 146/223 项清单哈希分别通过；三个 Git 根目录独立；本机配置、原包及子仓内容的父仓忽略规则通过；11 个本地文档链接有效。

用户已指定 Emergency Jam 为首个重建项目。其原版基线、H5 工程和实际进度见 projects/emergency-jam/docs/REBUILD_PLAN.md。Pegball 的计划在 projects/pegball-frvr/docs/REBUILD_PLAN.md。

所有重建默认竖屏；横屏由用户额外说明。验证顺序为 H5 → 用户人工通过 → 微信小游戏 → Android。

新机器先生成本机环境配置，再分别克隆项目和放置资源。Emergency Jam 已开始 Cocos 素材导入和 H5 构建；平台验收状态归项目维护，不能从 H5 结果推断其他端通过。
