---
name: game-package-audit
description: "核验游戏提取包的完整性、资源来源、引擎线索与运行依赖；用于接收资源包或重建前盘点，不用于普通玩法修改。"
---

# 游戏资源包核验

工作区索引见 projects.json，原包在 resources/；各项目是 projects/ 下的独立 Git 仓库。先读目标项目 AGENTS.md、project.config.json 和 docs/REBUILD_PLAN.md，项目进度和轻量验收摘要写回项目仓库。工作区路径可由 REBUILD_WORKSPACE_ROOT 指定。


在工作区根目录阅读 AGENTS.md 与目标包的 README、DATA_GUIDE。先确定包的版本和清单范围，区分原始下载、派生资源、工具及报告。

- 优先复用并检查既有校验工具；不能运行时使用可用运行时计算 SHA-256。解析清单时验证解析后的路径位于包内；逐项报告缺失和不一致，另列清单外文件。
- 分开记录下载文件数、派生文件数和清单条目数，不把逻辑别名或图集帧当作额外下载。
- 依据入口、加载器、来源索引确认引擎与依赖；SDK 中字符串出现不等于当前分支实际使用。
- 不执行下载器或覆盖原提取数据来“修复”校验结果；把缺口和后续处理记录到报告。
- 模型结构 JSON 不一定包含原始二进制；静态玩法表也不一定是最终运行结果。
- Unity 包还须区分原始脚本、含真实 IL 的程序集、IL2CPP metadata、原生二进制/WASM、符号及 dummy DLL，列明哪些代码材料存在、哪些尚未解析。进入重建时转入 [unity-package-rebuild](../unity-package-rebuild/SKILL.md)，包哈希通过不等于方法或玩法已恢复。

输出到 `evidence/<game>/package-audit.md`（目录不存在时创建），记录检查日期、方法、清单与源版本、成功/失败/额外文件、关键资源及未知项。未启动游戏时明确注明运行完整性尚未验证。
