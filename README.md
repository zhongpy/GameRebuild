# GameRebuild 工作区

此仓库管理通用工作规范、技能、工具链模板及首次环境检查。每个游戏拥有独立 Git 仓库，原始资源包和本机配置不入库。

```text
GameRebuild/                       工作区 Git 仓库
  AGENTS.md                       通用工作约定
  .agents/skills/                  可复用工作流
  environment.example.json        环境配置模板，入库
  environment.yml                 Conda Python 工具环境声明，入库
  environment.local.json          本机解析后的配置，不入库
  tools/check-environment.mjs      首次检查与配置生成
  docs/ENVIRONMENT.local.md       本机检查报告，不入库
  projects.json                   项目目录和资源对应关系
  projects/
    emergency-jam/                独立 Git 仓库
    pegball-frvr/                 独立 Git 仓库
    fortress-merge/                独立 Git 仓库
    castle-defenders-clash/        独立 Git 仓库
  resources/                      原始提取包，不入库
  reference/                      本地参考运行副本，不入库
  evidence/                       本机运行证据，不入库
```

## 新机器首次工作

1. 安装 Git 和 Node.js 18 或更高版本，克隆本工作区仓库。若 Node 尚未安装，环境脚本无法启动，先完成这一步。
2. 在工作区根目录执行 `node tools/check-environment.mjs --write`。
3. 查看 `environment.local.json` 和 `docs/ENVIRONMENT.local.md`。脚本从 PATH、相关安装记录和有限的常用目录查找工具，不全盘扫描。非标准安装位置在配置的 `overrides` 中填绝对路径，再执行同一命令。
4. Python 使用 Conda 专用环境：安装或定位 Conda 后执行 `node tools/setup-python.mjs`，再执行 `node tools/check-environment.mjs --write`。环境位于被忽略的 `.local/conda/game-rebuild-tools`，由 `environment.yml` 声明 Python 3.11 和 PyYAML 6.x。Conda 不在常见路径时填写 `overrides.conda`。
5. 按报告安装其他缺失版本或修正路径，重跑检查。检查脚本不会安装工具；setup-python 仅创建上述专用环境，不修改 Conda base、其他环境、系统变量或 Creator 全局设置。
6. 按 `projects.json` 的路径分别克隆项目仓库；没有远程地址的项目先由项目维护者补充地址。不会由父仓库自动拉取。
7. 将原始资源包放到 `resources/` 中相应目录，按包内清单核验。工作区克隆不包含这些包。
8. 阅读所选项目的 README、AGENTS.md 和实施计划，再执行编辑器导入、构建和真机验证。

运行不带 `--write` 的检查命令仅输出结果。退出码 0 表示静态必需项已找到，2 表示仍有必需项缺失/不匹配/未核实，1 表示脚本或配置错误。即使退出 2，`--write` 仍生成带缺口的正式本机配置和报告，不会伪称环境完整。

`environment.example.json` 维护共享版本基线；`environment.local.json` 的 `overrides` 指定机器路径，`resolved` 是自动生成的解析结果。手改路径请修改 overrides，不要改 resolved。重跑会保留本机 requirements 和 overrides，重新发现工具并生成报告；调整版本基线后，应同步检查本机 requirements。

本机配置只对读取它的工作区工具/构建脚本生效，不能代替 Creator 内部设置。实际工程构建脚本应读取 resolved 并传给构建进程；首次编辑器设置参照报告填写。不能把“生成配置”当成“已配置并验证编辑器”。

当前自动发现以 Windows 为主要验证平台，并提供 macOS/Linux 常见路径候选；其他布局用 overrides 配置。非 Windows 的 GUI 版本读取未验证，会保守显示 unverified。

## 仓库分工

- 工作区仓库：通用 AGENTS、skills、环境模板、检查工具、项目索引和协作说明。
- 项目仓库：源码、场景/Prefab/.meta、构建配置、项目规则、玩法计划和验收摘要。各自的 `git status/add/commit/remote` 在项目目录操作。
- 本地资源：原始包、运行参考副本及大体积证据不由工作区 Git 管理。项目所需的派生资源及来源映射由项目自身明确管理，不能因原包不入库造成项目无法重建。

这里采用独立嵌套仓库，未配置 submodule。`projects/*` 被父仓库忽略，父仓库不会记录子仓库内容或提交指针；项目可单独克隆、推送和迁移。需要版本联动时再另行引入 submodule/版本清单。

跨仓工作需分别提交；不要在工作区运行强制添加项目/资源的命令。当前未设置远程地址，本地提交历史以各仓 `git log` 为准。

## 通用文档与验证

- [Cocos 工作规范](docs/COCOS_WORKFLOW.md)
- [Unity 游戏包重建规范](docs/UNITY_REBUILD_WORKFLOW.md)：代码/资源分析、证据记录与 agent 任务模板
- [Unity 原包重建 skill](.agents/skills/unity-package-rebuild/SKILL.md)
- [技术评估入口](docs/COCOS_ASSESSMENT.md)
- [工作区推进计划](docs/REBUILD_PLAN.md)
- 检查脚本测试：`node --test tools/check-environment.test.mjs`

在项目仓库单独开启会话时，其 Git 边界可能不加载工作区 AGENTS/skills。项目自身必须保留足够的操作说明；需要通用规范时按项目 AGENTS 中的方式显式指定工作区路径，不把父目录自动加载作为前提。

Python 脚本使用本机配置 `resolved.python` 中的解释器；Windows 默认位于 `.local/conda/game-rebuild-tools/python.exe`，无需激活 base。`setup-python` 会复用符合要求的现有环境，不覆盖不兼容环境；旧版 Windows Conda 的 DLL 搜索路径仅在子进程补充，TLS 校验保持启用。[Conda 环境说明](https://docs.conda.io/projects/conda/en/stable/user-guide/tasks/manage-environments.html)
