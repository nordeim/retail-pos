继续执行 V28 修复周期（会话在 B4 之后、提交之前被工作区重置打断——第二次重置；整个周期在第二个全新克隆上重新执行，每一步重新验证，包括 born-RED 演示）。先重建环境，然后从 session_52 双语日志开始收尾。

重新克隆仓库（HEAD `f26630d` = V27 完成态不变）。环境重建：`.env`（DATABASE_URL="file:../db/custom.db"）、bun install（488 包）、db:push + db:seed（参考镜像）、chromium-1243 安装。

在第二个克隆上重新执行 TDD 全序列：
- **B2（born RED 重新演示）**：文档 pin 再次 **2 RED**（AGENTS + SKILL 均在 generate-head-assets.py 上——精确的 F1 引用）；普查再次 **1 RED** 列出精确的四个死包。RED 运行再次证明 pins 守卫的是真实声明。
- **B3（修复重新应用）**：AGENTS.md §15 + SKILL.md 的真实资产来源声明替换再生成声明；`bun remove` 四个死包（package.json + bun.lock 一起移动）。两层 pins 转绿：22/22 · 3/3。
- **B4（变异验证重新运行）**：(a) 植入伪造 scripts/does-not-exist-probe.ts 引用 → 恰好在 CLAUDE.md 测试上 RED → 还原 → GREEN；(b) 植入伪造 acme-widget 包行 → 恰好列出 acme-widget RED → 还原 → GREEN。全量 gates：**lint 0 · tsc 0 · build ✓ · 577/577 unit (43 文件, 568+9) · 203/203 e2e (3.7m, 零 flake)**——四个未引用包的移除对每一层都不可见。
- 四张 v28 截图重新捕获并 PNG 校验（ventas-1280 标题实测 "Ventas | VeloxPOS"——V27 guard 的面；dashboard-1280；mobile-terminal-390；mobile-drawer-open-390——spine freeze 保持）。
- **B5（文档同步重新应用）**：README（徽章 577+203）、AGENTS（§15 + 六文档范围 + 清单普查条目）、CLAUDE（v28 契约注 + 计数，v27 注保留，最新在前）、PAD v2.15.0（历史 + **ADR-037** + §8 表 + 两个新 seam 行）、SKILL v1.22.0（v28 收尾层 + 计数 + §12 **F12** 教训）。三个 V27 计数残余（SKILL 技术栈表 "201 specs" + 两个命令块 "201/201"）清扫为 203/203。remediation-plan-v28 §6、session_51、本日志、worklog V28 条目。每次文档编辑后重跑单元套件保持绿色（普查 + 文档 pin 读取存活文档——锁步本身经 gate 验证）。

本轮审计结论回顾（第一个克隆上完成，结论不变）：
- 参考站第 13 周期无变化（390×844 视口锁定、无汉堡、两个 aria-expanded 按钮是 Radix Select 组合框）。
- 克隆站抽屉 spine 第 13 次精确匹配冻结账本（无 Tailwind v4 bug）；Esc + 焦点返回验证通过。
- 引用扫描 19/19 干净；Known-Issues 零存活项。
- neo-crm 单一新提交（`769ba13`）全读——已采纳 session-196 的原始操作记录（session_415.md），无新教义。
- V27 标题守卫探针重跑 12/12 干净（最小 margin 9ms/11ms——竞态形状仍在，guard 每次纠正）。
- **F1**：`scripts/generate-head-assets.py` 被 AGENTS.md §15 与 SKILL.md 引用但从未提交（`git log --all` 为空）——出生即过期的声明存活 22 个周期，因为 pin 只扫描 DEPLOYMENT.md。
- **F2**：web-application 技能 §2 死依赖普查首次运行发现四个死包——@radix-ui/react-radio-group、react-scroll-area、react-toast（仓库 toaster 是自定义 zustand 构建）+ bun-types（实证死包）。

本地提交 + SSH wrapper v3 推送收尾本轮周期（仅 main 分支）。

**本轮核心交付**：
- **交付物真值清扫（ADR-037）**：仓库的声明与仓库的清单都是交付面，都需要 gate 齿——F1 的六存活文档脚本引用 pin + F2 的常设依赖普查（含显式 INFRA allowlist；普查文件排除自身表面——普查不得把仪器当证据）。两层 pins born RED 且双向变异验证。
- **Gates**：lint 0 · tsc 0 · build ✓ · **577/577 unit · 203/203 e2e（零 flake）**；4 张 PNG 校验截图；完整文档锁步（PAD v2.15.0、SKILL v1.22.0、session_51/52、worklog）+ 三个 V27 计数残余清扫。
- **重置的教训**：重置损失的是时间，不是真相——第二个克隆上重新演示了 born RED、变异验证与全量 gates，每个声明都有第二遍的证据支撑。

**后续建议**：一切绿灯且最新——未来周期可复查 neo-crm 最新会话、重跑引用扫描 + Known-Issues + 新普查工具，或开拓新超集面。由您定夺。
