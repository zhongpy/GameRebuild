---
name: cocos-project-workflow
description: "建立或修改本工作区的 Cocos Creator 重建工程，处理资产导入、版本约束及 H5、微信小游戏、Android 构建验收；不用于原始网页参考副本适配。"
---

# Cocos 重建工程工作流

工作区索引见 projects.json，原包在 resources/；各项目是 projects/ 下的独立 Git 仓库。先读目标项目 AGENTS.md、project.config.json 和 docs/REBUILD_PLAN.md，项目进度和轻量验收摘要写回项目仓库。工作区路径可由 REBUILD_WORKSPACE_ROOT 指定。


从工作区根目录阅读 AGENTS.md、docs/REBUILD_PLAN.md、docs/COCOS_WORKFLOW.md；环境和已知迁移风险见 docs/COCOS_ASSESSMENT.md。Creator 版本以项目配置为准，目标 H5、微信小游戏、Android。

- 先确认任务是环境验证、资产迁移、玩法实现还是平台构建，只执行相关步骤。资产转换依据原清单，结果写到重建工程并保存来源。
- 建工程采用真实同版模板/编辑器，验证能打开和导入；已有工程先核对版本、配置和 UUID，不重新初始化覆盖。
- core 保持纯 TypeScript；Cocos 组件与平台 SDK 经边界接口连接。不要因浏览器可运行而引入 DOM 依赖到三端共用代码。
- 新素材先小样验证：GLB 的空间/材质/碰撞；图集的裁切、旋转和原尺寸；SVG 的离线转换及动态换色。成功导入不能替代运行外观对照。
- 构建前核对实际生成配置和本机工具，不自动使用最高 NDK 或修改全局环境。首次或换机运行工作区环境检查，读取 environment.local.json 及生成报告，不在技能中固化某台机器的缺口。
- 构建配置从该版本编辑器导出再自动化；核对日志、退出码和产物，注意 Creator 的构建成功码 36。
- 三端分别报告构建、工具运行和设备运行状态。AppID、登录、SDK 或设备缺失只阻止对应验证项，继续完成不依赖它们的工作。

产出实际工程改动、可复用构建配置及 `evidence/<game>/` 中的验证记录，并更新重建计划。未执行素材导入/构建/真机步骤不能写为通过；长期修复放入源码、模板或构建扩展，避免只修生成目录。
