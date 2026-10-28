我将开始执行这个全面的修复与对齐工作流。让我先制定任务计划，然后从刷新工作区开始。
工作区已被重置，需要全新克隆仓库：
仓库已克隆，最新提交显示 remediation-plan-v26 已执行完毕。现在查看仓库结构：
✅ 仓库已克隆。现在精读核心文档（第一批：项目定义文档）：
AGENTS.md 较大，分段读取：
现在读取 README 和架构文档：
现在读取 worklog 尾部（最新 V26 条目）：
V26 周期已完成并推送。我的会话是 **V27 周期**。现在读取 PAD 与 SKILL 头部确认版本状态：
文档精读完成。项目状态明确：V26 已完成，我的会话是 **V27 周期**。现在对照代码库验证对齐，并重建本地环境：
配置验证一致。现在重建本地环境：
数据库就绪（`<repo>/db/custom.db`）。现在运行基线 gates：
单元测试 563/563 全绿。现在运行 build：
E2E 有失败项，查看详细信息：
所有失败都是 0-1ms —— 这是 setup 层故障而非真实测试失败。查看具体错误：
根因明确：Playwright chromium 浏览器未安装（环境问题，非代码问题）。安装 chromium：
✅ **基线 gates 全绿：lint 0 · tsc 0 · build ✓ · 563/563 unit · 201/201 e2e (3.6m)** —— 与 V26 收尾完全一致。

进入审计阶段（第 12 周期）。先检查 neo-crm 是否有新提交，并加载 agent-browser 技能：
neo-crm 无变化（仍为 `316fbe2`）。现在启动 dev server 并开始参考站审计：
Dev server 就绪且健康。开始参考站审计（第 12 周期确认）：
表单可能未正确提交。用标准 fill 流程重试：
已登录参考站。Terminal 保持 shift-gated。快速核查各视图状态：
⚠️ 发现两个 `aria-expanded` 按钮——需要验证参考站是否出现汉堡菜单（前 11 个周期均无）。深入检查：
虚惊一场——那两个按钮只是 Ajustes 页面上的 Radix Select 下拉框（`role="combobox"`），并非汉堡菜单。**参考站第 12 周期确认无变化**（390px 视口锁定、无汉堡菜单、数据状态与 V26 记录完全一致）。

现在审计克隆站——登录并实测移动端抽屉 spine 几何（第 12 次确认）：
检查 seed 的默认密码（bun `$`-expansion 契约——密码默认值在 seed.ts 内）：
已登录克隆站。现在进行关键的移动端抽屉审计（390×844）——实测 spine 几何：
链接几何完全匹配冻结账本（y=81+44k）。精确测量 panel/header/nav/footer：
Spine 几何完全匹配冻结账本。验证关闭按钮与 Esc 行为：
✅ **移动端抽屉 spine 第 12 次确认**：panel [0,0,288,844] · header [0,0,287,69] · nav [0,69,287,727] · footer [0,796,287,48] · close [235,16,36,36] · 8 links y=81+44k · Esc 关闭 + 焦点返回 —— **无 Tailwind v4 bug**。

现在执行审计扫描，寻找 V27 周期目标。先重跑 V26 引入的引用扫描（citation sweep）：
引用扫描：17 处引用全部有效，零失真。现在调查 **F2 flake watch**（V26 全量运行中 v9 Spanish-alias 标题测试出现一次 flake——已知未决项）：
理解了 flake 历史（V18 首现→V26 复发，9 个周期的 watch 项）。这是 V27 的有力目标。先分析 playwright 配置与标题竞态：
理解了标题链。现在检查 `not-found-title.tsx`（同族竞态已有解法——guarded MutationObserver）：
发现关键线索：`not-found-title.tsx` 用 guarded MutationObserver 解决了**完全相同的竞态**（"bare effect write 会被 Next 元数据管理器在挂载后 0-50ms 内覆写"），而 `page.tsx` 的标题 effect 仍是**裸 effect 写入**——正是文档记载的易碎形状。检查 page.tsx 的元数据导出与竞态面：
竞态面确认：根布局携带 `title: "VeloxPOS"`，页面无 metadata 导出。扫描全代码库中所有裸 `document.title` 写入点：
完整图景确认。这是 V27 的周期目标：**page.tsx 的标题 effect 是裸写入——与 v7 已在 404 面解决的同一竞态**。按 Mode B 调试纪律，先写探针脚本**复现**该竞态：
启动 standalone server（与 e2e 环境一致）并编写探针。先看现有探针脚本的房屋风格：
编写 V27 标题竞态探针（自包含、房屋风格）：
修复探针中相对 URL 问题（context.request 需要绝对 URL）：
改用原生 fetch + 手动构造 storageState（绕开 playwright request 在 Bun 下的 URL 解析怪癖）：
导入已更新。现在分别替换两个函数：
直接重写探针文件（更干净）：
90 次迭代无 clobber。需要实际观察标题时间线来理解真实序列。修改探针输出时间线详情：
关键发现：recorder 只记录到初始空标题——init script 时 `document.head` 是占位节点，解析后被替换，observer 失效。改用 prototype setter 补丁 + documentElement 观察（可靠捕获所有写入序列）：
时间线只显示两条记录——SSR 的 "VeloxPOS" 从未出现。检查 SSR HTML 的实际 title 与来源标记：
SSR HTML 确实包含 `<title>VeloxPOS</title>`（在 script 标签之后）。需要验证 Next 元数据 re-apply 是否真的发生。先修复 recorder 的 documentElement 时序问题，并检查 404 页与 api seam：
404 页 SSR 也有 `<title>VeloxPOS</title>`。需要验证 recorder 本身是否正常工作——快速诊断 observer 注册问题：
从 /tmp 运行解析了错误的 playwright 版本。将诊断脚本放入仓库内运行：
**Recorder 根因找到**：init script 时 `document.documentElement` 为 NULL——observer 注册抛错（domFired: 0）。修复 recorder（轮询等待 documentElement）后重跑：

继续 V27 周期。先检查工作区状态（dev server / standalone server 是否存活），然后扩展探针验证 SPA 导航下的标题竞态：
重新克隆完成（HEAD `d02d793` 不变）。先恢复环境（.env、依赖、DB），并重建探针脚本（含此前的全部修复 + 新增 SPA-nav 模式）。同时检查路由机制以理解 SPA 导航是否触发元数据 re-apply：
环境已恢复。确认了 SPA 导航用 `pushState`（非 next/router）——Next 元数据 re-apply 不会在视图切换时触发，竞态面在**启动时刻**。现在重写探针脚本（含此前所有修复），并重建 build：
Build 的 typecheck 会扫描 `scripts/`。查看现有探针如何处理类型（`window.__titleLog` 等自定义属性）：
`tsconfig` 包含 `scripts/`（排除 archive）。修复探针的类型错误（native fetch 的 `res.status` 是属性非方法；`window.__titleLog` 需类型断言）：
e2e.db 尚不存在（新克隆未跑过 e2e）。为其推 schema + seed（与 global-setup 一致的固定身份）：
**竞态证据已量化**：36 次迭代，shell 写入与最后一次元数据写入的**最小间隔仅 9ms**（元数据 re-apply 晚至 ~295ms）。全量 suite 负载下 ~10ms 的翻转即造成永久覆写 → 正是 v9 标题 flake 的签名。

现在检查现有 v9 单元 pin（修复须扩展而非削弱），并参照 recovery-a11y 源 pin 风格设计新 pin：
审计收敛。现有 v9 源 pin（`document.title =` 存在性）与我的修复兼容（guarded 写入仍赋值 `document.title`）。现在编写 remediation-plan-v27.md：
计划已保存。进入 **B2——先写 pins（TDD RED）**。查看 navigation.spec.ts 的 SPA 导航模式以对齐房屋风格：
编写两个新 pin 文件（B2，TDD 先行）：
运行 pins 验证 **born RED**（TDD 的第一步）：
单元 pin **born RED（4 失败 / 1 通过）**——符合预期。现在运行 e2e pin（需当前 build 的 standalone server）：
E2E pin **born RED（2 失败）**。确认失败形状是预期的“覆写不被纠正”（而非其他错误）：
两个失败均为预期形状：测试 1 = 覆写永久粘滞（正是 flake 签名）；测试 2 暴露一个**测试自身缺陷**——侧栏链接走**规范路径** `/Sales`（标题应为 "Sales | VeloxPOS"）。修正测试 2 使其也 pin guard（导航后覆写→纠正），然后实施修复：
修复已应用。同时修正 e2e 测试 2（侧栏链接走规范路径 `/Sales`；并使其 guard 敏感）：
重建 build 并验证修复后 pins 转 **GREEN**：
这只是 V26 boot-guard 的既有 Edge Runtime **警告**（非错误）。验证 build 完成与 standalone 更新时间：
Build 成功（exit 0）。运行两个新 pin 验证 **GREEN**：
✅ TDD 循环完成：RED → 修复 → GREEN（unit 5/5 · e2e 2/2）。执行 **B4 变异验证**——植入裸写入回归，pins 应变 RED：
**变异验证 RED 确认**：unit 4 失败 · e2e 2 失败——pins 确实守卫着 guard。恢复修复：
恢复后 GREEN（5/5 · 3/3）。变异验证完成。现在运行**全量 gates**：
✅ **全量 gates 绿：lint 0 · tsc 0 · build ✓ · 568/568 unit (42 files) · 203/203 e2e (3.6m)**。快速重跑探针确认修复后无写入循环（observer 仅在标题错误时写）：
修复后时间线与修复前完全一致（无额外写入、无循环——guard 只在标题错误时写入）。现在捕获 v27 证据截图（dev server）：
4 张截图已捕获。验证 PNG 有效性（尺寸 + 文件头）：
✅ 4 张截图全部有效（尺寸正确）。进入 **B5 文档同步**。先定位所有计数提及点：
现在逐一更新文档。先 README 与 CLAUDE.md：
现在更新 AGENTS.md（§17 标题契约处追加 V27 guard）：
现在更新 PAD。先看版本头与历史条目结构：
现在添加 ADR-036 到 ADR 索引并更新 §8 测试表：
查看 ADR 表的完整结构以确定 ADR-036 插入点：
ADR-035 是最后一行。在其后追加 ADR-036，并更新 §8 测试表：
检查 §8 单元 seam 清单（v26 添加过），追加 title-guard：
PAD 完成。现在更新 SKILL.md（版本、计数、close layer 描述、§12 F11 教训）：
查找 §12 教训清单（F10 之后追加 F11）：
填写计划 §6 执行结果：
现在编写 session_49.md（精炼会话日志，对齐 session_47 风格）：
追加 worklog V27 条目：
文档同步完成。重跑单元套件（source pins 会扫描文档文件）并审查完整 diff：
变更集干净。审查核心源码 diff 确认手术式修改：
Diff 手术式正确。现在本地提交（house 风格提交信息）：
提交为 `0ffb8e3`。现在阅读 SSH wrapper 推送说明并准备推送：
SSH wrapper 流程已内化。检查 ssh 二进制与 paramiko 可用性：
无 ssh、无 paramiko——采用 Appendix A shim 路径。安装 paramiko 并部署 shim 到仓库外：
Shim 已部署。物化操作员密钥并验证指纹：
指纹匹配（`SHA256:4FSV1Prot+...` 与历轮一致）。执行 dry-run：
Wrapper 认证成功但默认 remote 是 `task-management`——需显式传 `--remote git@github.com:nordeim/retail-pos.git`：
Dry-run 干净（fast-forward `d02d793..0ffb8e3`）。执行真实推送：
✅ **推送成功：remote main @ `0ffb8e3` == local HEAD**。销毁操作员密钥：
**V27 周期已完成并推送至 main @ `0ffb8e3`**（remote 已验证 == 本地 HEAD，密钥已销毁）。

**本轮核心交付**：
- **9 周期 flake 根因关闭**：探针实证 Next 元数据管理器每轮启动重写根标题 5–6 次（末次 ~295ms），而 shell 裸写入仅领先 9ms——负载下顺序翻转即永久覆写。修复移植了仓库 v7 在 404 面的同款 guarded MutationObserver 解法。
- **TDD 全程**：pins born-RED（e2e 复现 flake 精确签名）→ 修复 → GREEN → 双向变异验证。
- **Gates 全绿**：lint 0 · tsc 0 · build ✓ · **568/568 unit · 203/203 e2e（零 flake）**；移动端抽屉 spine 第 12 次实测精确匹配冻结账本（无 Tailwind v4 bug）；参考站第 12 周期无变化。
- **文档同步**：PAD v2.14.0（ADR-036）、SKILL v1.21.0（F11 教训）、remediation-plan-v27、session_49、worklog、4 张验证截图。

**后续建议**：下个周期可复查 neo-crm 新会话、重跑引用扫描，或开拓新超集功能面。
