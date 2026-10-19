# 游戏重建工作区约定

## 仓库边界与入口

- 本仓管理通用规范、skills、工具和环境模板。projects/ 下每个项目是独立 Git 仓库；游戏规则、源码、计划和验收摘要归项目仓库。
- 先读 README.md、projects.json，再读目标项目的 AGENTS.md、README、project.config.json 和 docs/REBUILD_PLAN.md。不要把某个游戏的细节写进通用规范。
- Git 操作明确仓库目录；不强制添加被忽略的项目、资源、本机配置或产物。各仓库分别提交和管理远程。
- Cocos 工程工作阅读 docs/COCOS_WORKFLOW.md。当前目标平台为 H5、微信小游戏、Android，各项目具体版本以其 project.config.json 为准。

## 环境初始化

- 首次工作、换机或工具变更时执行 node tools/check-environment.mjs --write，读取 environment.local.json 和 docs/ENVIRONMENT.local.md。
- environment.example.json 入库；本机配置和报告不入库。机器路径写入 overrides，不写死到通用源码、技能或项目文档。
- Python 工具使用 environment.yml 声明的专用 Conda 环境。首次执行 node tools/setup-python.mjs，再刷新检查报告；不使用 base 或其他项目环境安装本工作区依赖。调用解释器读取 resolved.python。
- 模板提供默认版本；项目版本不同须按项目约束配置并记录，不能由通用规范静默升级项目。
- 自动探测只生成工作区配置，不能假定已改变 Creator 偏好设置。实际工具使用 resolved 路径或项目本地配置。
- 缺失项说明要求版本；已发现不等于构建已通过。缺少 Android 组件不阻止不依赖它的 H5 工作。

## 证据与资源

- 原始包放在 resources/，映射见 projects.json，内部文件保持原样。适配、格式化、转换和重新提取输出到独立目录。
- reference/<id>/ 保存本地参考副本，evidence/<id>/ 保存运行证据，不入工作区仓库；轻量验收摘要保存在项目仓库。
- 结论区分源码证实、运行观察、推断、未知，记录版本与来源。静态声明和遗留代码不直接当作已启用玩法。
- 派生资产保留原包名、输入哈希、逻辑名、转换工具/参数与输出映射；由项目明确管理，确保可以重复恢复工程。

## 实现与验收

- 每次完成一个可验证闭环。规则与渲染、输入、音频、存档及平台服务分离；纯 TypeScript 规则层不直接依赖 cc、DOM、wx 或原生桥。
- 资源与 .meta 一起保存和移动，保留 UUID；不猜测场景序列化结构，不把 library、temp、build 缓存作为源码交付。
- 记录随机源、时间步、输入与初始状态；修改原版碰撞或更新语义须有对照证据。
- 广告不可用、失败、取消、成功分别处理；开发模拟可识别，不能统一伪造奖励成功。
- 各平台分别记录构建、工具运行、设备运行；视觉对照固定视口/像素比/场景/时刻，容差有依据。
- 测试优先覆盖规则和实际边界问题，文档不新增机械重复测试；未执行验证明确保留为未验证。

## 技能

.agents/skills/ 提供资源核验、参考运行、重建验收和 Cocos 工作流。独立项目会话按需显式访问工作区，可由 REBUILD_WORKSPACE_ROOT 指定；不假定跨 Git 边界自动发现规则或技能。
