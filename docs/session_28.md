我将开始 V16 周期。首先建立任务清单，然后用干净、隔离的命令验证工作区真实状态（上次会话 git 输出损坏，按不可信数据处理）。
工作区已被重置（空目录）。按指令重新 clone 仓库：
Clone 成功（3720 个文件）。验证仓库状态：
仓库状态干净：`main` 分支，最新提交 `8250e12`，V14/V15/V16 修复均已落地。现在检查文档结构：
仓库结构完整：session_25/26、remediation-plan-v16、worklog 均存在；vitest/playwright 配置和 .env.example 已就位。注意到根目录**没有 `db/` 文件夹和 `.env`**（需创建）。

现在精读 5 份核心文档：
CLAUDE.md 已读完。读取 AGENTS.md 完整内容（持久化输出）：
AGENTS.md 已读完。现在读 README 和最新的 session 文档（session_25/26、remediation-plan-v16）：
README 已读。现在读取最新的 session 文档与 remediation plan：
Session 26 确认 V16 已完成并推送（`82c4459`）。读取 remediation-plan-v16 与 worklog 尾部：
现在读取 worklog 尾部（最新 V16 条目）：
V16 状态确认。现在对照代码库验证关键声明（palette block、sortOrder、测试配置、.env.example）：
V16 声明全部验证通过。现在搭建环境（bun install、.env、db:push、db:seed）：
数据库就绪。运行基线门禁（lint → typecheck）：
Unit 478/478 ✓。运行 e2e 套件（长门禁）：
Playwright 浏览器版本不匹配（需 chromium-1243）。安装匹配的浏览器：
**基线全绿：lint 0 · tsc 0 · build ✓ · unit 478/478 · e2e 173/173** —— 与 V16 关闭状态完全一致。

现在进入审计阶段。读取 skills 目录与 web-application SKILL：
373 个技能。读取任务指定的关键技能文件：
技能契约已理解。现在审计近期代码改动（V16 diff）与移动端导航实现：
移动端抽屉实现符合契约。检查 Tailwind 实际版本与 tw-animate 行为：
Tailwind 4.3.3 + tw-animate-css 1.4.0 与文档一致。查看移动导航 e2e pin，然后启动探针服务器：
移动导航契约已 pin（9 个测试）。启动克隆探针服务器进行实时对比：
现在进行实时对比。先检查参考站可达性，同时启动克隆探针：
仍在 /login。检查页面状态与错误信息：
React 状态未捕获输入。用原生 setter 模式重试：
误点了 Google 社交按钮。返回并精确点击表单提交按钮：
已登录参考站（Terminal `/`）。开始 V17 审计 —— 先调查参考站当前状态：
两台 Caja 均为关闭状态（与 V16 一致，无状态变化）。检查 Cajeros/Ventas 状态后进入移动端 390 审计：
参考站数据状态与 V16 完全一致。现在进行移动端 390 审计（任务重点）—— 先看参考站在 390px 的行为：
参考站 390px：无汉堡菜单、有侧边栏。深入测量其几何：
参考站 390px 确认：220px 侧边栏挤压内容至 170px 宽、无汉堡菜单（与披露一致，克隆的抽屉是正确的超集）。

现在启动克隆探针服务器，写 V17 探针脚本验证克隆侧移动端行为：
Bun 在 /tmp 中解析到了不同版本的 Playwright。将探针脚本移入库内 scripts/ 目录（沿用往期做法）：
抽屉契约全部验证通过（200ms 动画、288px、44px pitch、焦点管理、内部滚动、无横向溢出）。唯一疑点：第 1 步 `appBar:false` 可能是水合时序假象 —— 快速复验：
App bar 验证通过（64px、汉堡+品牌齐全）—— 之前是水合时序假象。**移动端导航菜单：完整契约验证通过**。

检查 docs/lighthouse 既有内容，评估 CWV 性能审计基础：
**发现：docs/lighthouse/ 是 study-app 时代的陈旧产物**（localhost:3200，端口都不对）。这正好对应 session_25 建议的 Core Web Vitals 性能 pass。

检查 Lighthouse 可用性并对当前生产构建运行性能审计：
Lighthouse 13.5.0 可用。编写 V17 CWV 探针（登录页直接测；authed 页面经 CDP 端口附加已登录浏览器）：
Dashboard：perf 70 / a11y 100 / bp 96 / seo 100，LCP 3.3s 是主要短板。登录页运行报错——查看错误并重试：
命令异常快速退出。重试并保留完整输出：
错误明确：CHROME_PATH 未设置。指向 Playwright 的 chromium 后重试：
chrome-launcher 启动 chrome 失败。尝试容器常见修复参数：
登录页：**perf 86 / a11y 100 / bp 100 / seo 100** ✓。分析 Dashboard perf 70 的 LCP 瓶颈：
FCP 1.8s · TTI 3.4s · LCP 3.3s。检查应用启动数据流是否存在串行瀑布：
启动链已并行化（预加载与 auth/me 并行）。检查未使用的 JS 块构成，评估优化空间：
检查 Dashboard 的 LCP 元素构成（Playwright PerformanceObserver）：
温导航 LCP 仅 188ms（数据链 ~90ms 完成）—— 冷启动瓶颈在 JS 启动链。对照参考站跑 Lighthouse（性能对齐基准）：
**重大对照结论**：克隆站性能大幅领先参考站（login 86 vs 51；LCP 2.4s vs 14.4s；体积 314KB vs 2314KB）。检查 Dashboard best-practices 96 的扣分点：
两个线索需要深挖：console errors + 2610ms 重定向链。提取详情：
真相大白：Lighthouse CDP 附加时打开**无痕上下文**（不共享 cookie），测的是登出弹回流程而非 Dashboard 本身。用 `--extra-headers` 注入会话 cookie 重测：
heredoc 注释语法错误（`#` 泄入 TS）。修复：
真实的 Dashboard 数据：**perf 54 · a11y 94 · LCP 3.7s · TBT 550ms**。检查 a11y 扣分与 TBT 构成：
color-contrast 是已披露的参考站对齐偏差（a11y smoke 明确排除）；heading-order 需对照参考站确认。先识别最大的未使用块 0iytuzl6v72yp.js：
对照参考站验证 heading-order 结构（是否为对齐结构）：
参考站 heading 结构完全一致（H1→H3）—— heading-order 也是对齐结构。确认 TBT 阻塞源分布：
vendor 块 238_s 占 671ms scripting。检查其内容构成（是否 lucide 图标未摇树）：
238_s 块是 react-dom 本体（不可优化）。V17 改进方向明确：**视图代码分割（React.lazy + 预取）**。检查测试 pin 是否引用 page.tsx 结构：
page.tsx 的 pin 只检查类名字符串（不受 lazy 重构影响）。检查 e2e 是否有全视图渲染覆盖：
navigation.spec 已覆盖全路由渲染 + SPA 切换（lazy 重构的安全网齐备）。审计完成 —— 撰写 V17 修复计划：
计划已写。执行前对照代码库复核（单元 pin 约定 + e2e pin 可行性）：
设计已定。复核：视图文件导出方式 + 其他引用点：
视图均为命名导出、page.tsx 是唯一引用方 —— 重构范围干净。开始 TDD：先写 RED 单元 pin：
RED 确认（5 红 / 3 守卫绿）。实施 page.tsx lazy 重构：
单元 pin 8/8 绿 + tsc 0。构建并验证 chunk 分割效果：
视图已分割（17→27 chunks）。确认 terminal/registers 的独立 chunk：
分割成功：terminal 12KB / dashboard 15KB / inventory 21KB 等独立 chunk，入口脚本不含视图代码。写 e2e pin（RED 验证）：
E2e pin 3/3 绿。运行完整套件验证无回归：
**全部门禁绿：lint 0 · tsc 0 · build ✓ · unit 486/486（478+8）· e2e 176/176（173+3）**

现在重测 CWV 验证改进效果（B4）：
登录超时（可能是限流或时序抖动）。检查服务器日志并重试：
端口被遗留服务器占用（EADDRINUSE）导致脚本自举服务器失败。清理后重跑：
**改进实证：performance 54→67（+13），TBT 550→280ms（减半）**。刷新标准截图集 + v17 证据截图：
移动端证据集已刷新。补拍 v17 专项证据：短视口抽屉内部滚动（session_25 遗留问题的实证）：
B2：清理陈旧 study-app Lighthouse 证据，写入方法论 README：
B2 完成。现在文档同步 —— 先更新 AGENTS.md（契约 30）：
修正编号（29 之后应为 30）：
Now update CLAUDE.md (v17 block + counts) and README (badge + lighthouse pointer):
现在更新 PAD（v2.5.0 + ADR-027 + §8 计数）：
Now add ADR-027 and update the §8 test counts in the PAD:
更新 retail-pos_SKILL.md 版本与计数：
补全计划 §6 执行台账：
撰写 session_27.md 日志：
追加 worklog V17 条目：
最终门禁复核 + 检查外部 worklog 协议：
更新外部项目 worklog，然后查阅 SSH 推送流程：
流程明确。提交（沿用既有 message 约定与作者身份）：
提交完成（`2554c8f`）。现在经 SSH 包装器推送 —— 物化密钥、dry-run、真实推送：
预检失败。检查 shim 实现与调试：
Shim 依赖 paramiko 但环境重置后未安装。检查系统 ssh 或安装 paramiko：
paramiko 装在 python3.13 用户目录但 python3 找不到 —— 检查版本错配：
版本错配明确（venv py3.12 vs 用户 py3.13）。装入 venv：
试运行 (Dry-run) 清理（`8250e12..2554c8f` fast-forward）。执行真实推送：
**V17 周期完成并推送** —— `main @ 2554c8f`，远端已验证，密钥已销毁，工作树干净。
**V17 周期已完成并推送**（`main @ 2554c8f`，远端验证，密钥已销毁）。

**本轮做了什么：**

1. **工作区曾被重置** → 重新 clone 并重建环境（deps、.env、db push+seed、chromium），基线全绿（478+173）后才开始审计。

2. **移动端导航菜单（任务重点）—— 全契约实测通过**：390px 下抽屉 288px、200ms 滑入动画、8 链接 44px 均匀间距、Esc/背板/路由三种关闭、焦点进出管理、滚动锁定、短视口内部滚动可达、全部 8 条路由零横向溢出。参考站再次确认**没有任何移动菜单**（220px 侧边栏把内容挤到 170px 宽）——克隆的抽屉是正确的超集。Tailwind v4 无新 bug。

3. **Core Web Vitals（session_25 建议项）**：克隆登录页 perf 86 vs 参考站 51（LCP 2.4s vs 14.4s，体积 7 倍轻）。发现并修复 authed Dashboard 的 TBT 瓶颈 —— **视图懒加载注册表**（React.lazy + 启动期预取活跃视图 chunk，TDD：8 单元 + 3 e2e pin）→ **perf 54→67，TBT 550→280ms（减半）**。附带发现并修复了 Lighthouse CDP 无痕上下文陷阱（authed 测量需 `--extra-headers Cookie`）。

4. **门禁全绿：lint 0 · tsc 0 · build ✓ · 486/486 unit · 176/176 e2e**；陈旧 study-app Lighthouse 证据已替换为 v17 实测集；文档全链对齐（AGENTS 契约 30、PAD v2.5.0 + ADR-027、SKILL v1.12.0、session_27、双 worklog）。

**下一步建议**：在手机宽度窗口实际切换各视图体验按需加载；下周期可关注 INP（终端商品网格交互延迟）或参考站 register 状态变化后的卡片表面复审。
