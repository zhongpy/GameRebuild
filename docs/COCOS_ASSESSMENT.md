# Cocos 技术评估入口

目标为可维护源码，尽量还原原版玩法和画面，首批 H5、微信小游戏、Android。环境模板初始基线为 Creator 3.8.8 + TypeScript，具体项目独立锁定版本。

本机路径与版本由 tools/check-environment.mjs 检查并写入 environment.local.json 和 docs/ENVIRONMENT.local.md，均不入库；不把某次机器盘点当作所有机器的状态。具体游戏的迁移风险和实施计划放在各项目 docs/REBUILD_PLAN.md。

## 通用可行性与验证

Cocos 提供 [Web 构建](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-web.html)、[微信小游戏构建](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-wechatgame.html)和 [Android 环境配置](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/setup-native-development.html)路径。原游戏脚本、平台 SDK 和渲染对象仍需按新工程实现。

- GLB/glTF 先验证空间、材质、透明效果、节点和碰撞，导入成功不等于行为和外观一致。[glTF 文档](https://docs.cocos.com/creator/3.8/manual/en/asset/model/glTF.html)
- 普通图片支持列表未列 SVG，不能假定三端直接加载；候选方案为离线转换、分层图集或专门材质，按项目验证换色与清晰度。[图片文档](https://docs.cocos.com/creator/3.8/manual/en/asset/image.html)
- 图集需保留裁切、旋转、原始尺寸与偏移；自定义物理/布局需比较初态、输入、步长、碰撞顺序和输出。

## 工具链判定

Creator 模板、构建面板和生成工程可能包含不同参数，以实际生成配置及日志为准。区分 SDK Platform、Build Tools、NDK、CMake 的具体版本，不只检查顶层目录。

[AGP 8.10 兼容表](https://developer.android.com/build/releases/agp-8-10-0-release-notes)列出 Gradle 8.11.1、JDK 17、默认 NDK 27.0.12077973，但不证明某个 Cocos 工程已编译通过。环境模板中的 NDK 仍是待实测候选；按项目记录真正验证过的组合。

## 全面重建前

先做少量原素材、UI、音频、触控和存档的小场景，尽早验证 H5、微信工具/真机、Android 安装运行。缺少账号、AppID、工具或设备时记录具体缺口，继续不依赖它们的任务。

分别记录素材导入、构建、工具运行和设备运行；性能预算按设备及场景实测制定。目前完成通用规范及静态环境检查，尚未进行三端运行验证。
