我将开始执行这个端到端的修复与对齐工作流。让我先制定任务计划，然后刷新工作区。
工作区已被重置——没有 retail-pos 克隆。我将执行 `git clone`。
仓库已克隆成功。现在精读核心文档。
现在精读核心文档（并行读取）。
现在读取最新会话文档与 worklog。
session_44 与 session_45 均涉及 V25 周期。让我确认各提交对应的文件与 worklog 内容。
当前状态明确：V25 已完成并推送，我的会话是 **V26 周期**。现在读取 worklog 与 remediation-plan-v25。
V25 已完成，我的会话是 **V26 周期**。现在读取 PAD 头部与关键配置，并开始重建本地环境。
项目状态确认。现在重建本地环境（.env、bun install、数据库）。
环境就绪。运行基线 gates（lint → typecheck）。
**基线 gates 全绿：lint 0 · tsc 0 · build ✓ · 556/556 unit · 201/201 e2e** —— 与 V25 收尾完全一致。现在进入审计阶段：先检查 neo-crm 是否有新提交，同时启动 dev server 并加载 agent-browser 技能。
neo-crm 无新提交（仍为 `316fbe2` session-196）。本周期目标需来自自主审计。现在加载 agent-browser 技能并启动 dev server。
Dev server 已就绪。开始参考站审计（第 11 周期）——登录参考站。
已登录参考站，Terminal 保持 shift-gated。快速核查各视图状态（第 11 周期确认）。
**参考站第 11 周期确认无变化**（数据状态、五节 Ajustes、390px 无汉堡菜单）。现在用独立会话审计克隆站。
已登录克隆站。现在进行关键的移动端抽屉审计（390×844）——重新实测 spine 几何。
克隆站 spine 几何完全符合冻结账本（11 次连续确认，无 Tailwind v4 bug）。现在深入审计未 pin 的契约——首先检查 health 路由的 DEGRADED 分支（已知披露项）。
health DEGRADED 分支（503）是长期未 pin 的披露项——它可以通过单元测试 mock db 来 pin，而无需中途破坏数据库。让我继续扫描其他未 pin 的契约，检查 vitest 配置与测试结构。
health DEGRADED 分支是明确的未 pin 披露项，可通过 `vi.mock` 单元测试 pin。继续扫描其他未 pin 契约。
Docker healthcheck 依赖 `r.ok`（503 → unhealthy）——DEGRADED 分支是消费者依赖的行为契约，符合 gate-coverage 教义的 pin 对象。继续扫描其他错误路径契约。
已知问题记录干净。让我审查 V25 diff 与错误映射器的 pin 覆盖，确定 V26 周期目标。
Rate-limit 已充分 pin。现在原型验证 health DEGRADED 分支的单元测试可行性（`vi.mock` + NextResponse in node env）。
**原型验证成功**——两个分支都能在单元层 pin。删除原型，继续审计同族其他失败路径契约。
**发现文档失真**：instrumentation.ts 声称 "pinned by tests/e2e/s22-boot-guard.spec.ts"，但该文件不存在。验证此声明。
**确认失真声明**。检查 git 历史确认该 spec 是否曾存在于此仓库。
发现两处同族缺陷。系统性扫描 src/ 中所有 "pinned by tests/e2e/" 引用，验证每个是否真实存在。
引用扫描结论明确：instrumentation.ts 是唯一失真引用。再扫描 "pinned by" 类声明确保无其他失真。
审计收敛。检查是否有测试将 instrumentation.ts 作为源文件扫描（避免注释修改破坏 pin）。
无测试扫描 instrumentation.ts 内容——注释修复安全。做最后的配置验证，然后写 v26 计划。
所有 V24 pins 完好，tree 干净。审计完成。现在编写 remediation-plan-v26。
计划已保存。执行 **B2**——编写两个新 pin 文件。
现在修复 instrumentation.ts 中的失真引用注释。
运行两个新 pin 文件验证 born-green。
**B2 GREEN — 7/7**。执行 **B3 mutation proofs**。首先 F1：植入 503→200 缺陷。
**F1 MUTATION-PROVEN RED**（"expected 200 to be 503"——正是 Docker-healthcheck-失明缺陷形状）。恢复源码。
F1 恢复 GREEN。现在 F2 mutation：将 `process.exit(1)` 替换为普通 throw（注释中自述的缺陷形状）。
**F2 MUTATION-PROVEN RED**——两个 fatal 路径测试失败，warn/ok 保持绿（env-check 纯 seam pin 在此变异下仍全绿——正是 battery gap 证明）。恢复源码。
**B3 完成**——两处 mutation 均已证明。运行快速 gates（lint + typecheck）验证新文件。
TS 类型错误：`NODE_ENV` 在 @types/node 中为只读。用类型断言修复（运行时可变，仅类型约束）。
**快速 gates 全绿：lint 0 · tsc 0 · 563/563 (41 files)**。执行 **B4**——捕获 v26 截图。
4 张截图已捕获。验证文件有效性，然后进行 VLM 验证。
**全部 4 张截图 VLM 验证 PASS**。运行完整 gates：build + e2e。
1 个 e2e 失败（functional-parity-v9 /Ventas 别名测试）——我的改动仅为注释+新增单元测试文件，不应影响它。重跑该 spec 判断是否为 flake。
单独运行 11/11 全绿——全量运行时的 flake。重跑全量 e2e 确认。
**全量 e2e 201/201 GREEN**——确认 flake。B4 完成。执行 **B5 文档同步**。
现在在 CLAUDE.md 中 v25 contracts 注记后添加 v26 注记。
现在更新 AGENTS.md——security contract 区块增加 failure-path pins 行。
现在更新 PAD：版本头、v2.13.0 历史条目、ADR-035、§8 测试表。
现在添加 ADR-035 到 ADR 索引并更新 §8 测试表。
发现问题：ADR-034 行被替换而非追加。恢复 ADR-034 并正确添加 ADR-035。
ADR 索引已正确。更新 §8 测试表。
PAD 完成。现在更新 retail-pos_SKILL.md（v1.20.0 + 计数 + §12 教训）。
修复头部接缝处的重复文本。
现在查看 §12 的 F9 教训格式并追加 F10。
SKILL 完成。填写计划 §6 执行结果。
计划完成。现在编写 session_46.md（精炼会话日志，对齐 session_43 风格）。
现在追加 worklog V26 条目。
文档 lockstep 完成。重跑 unit suite（source pins 扫描文档文件）并审查完整 diff。
变更集干净。现在阅读 SSH wrapper 推送说明。
SSH wrapper 流程已内化。检查 ssh 二进制与 paramiko 可用性。
无 ssh/paramiko——采用实地验证的 shim 路径。先提交，同时安装 paramiko。
提交为 `233e75b`，paramiko 已装。部署 shim 到仓库外并物化密钥。
密钥指纹匹配（`SHA256:4FSV1Prot+Fe4gAmr8dWn63nrKiPv2A+nJw30h7oo+8`）。执行 dry-run。
Dry-run 干净（fast-forward `554b094..233e75b`）。执行真实推送。
**推送验证：remote main @ `233e75b` == local HEAD**，密钥已销毁。现在按 house 两提交模式添加原始会话日志 session_47。
**V26 周期完成并已推送：remote main @ `4c0f545` == local HEAD**。做最终健全性检查。
**V26 周期已完成并推送到 main @ `4c0f545`**。

**本轮交付（故障路径验证）**：
- **审计**：参考站连续第 11 个周期无变化；克隆站移动端抽屉 spine 实测与冻结账本完全一致（**无 Tailwind v4 bug**，第 11 次确认）；neo-crm 无新提交
- **发现并修复两处失败路径缺口 (ADR-035)**：F1 — health DEGRADED 分支（Docker healthcheck 依赖的 503）通过 `vi.mock` 单元测试 pin；F2 — boot-guard 接线未 pin 且注释引用了 V1 pivot 时已删除的 spec（引用扫描 16 处仅 1 处失真，已清除）
- **双变异验证**：植入 503→200 与 exit→throw 缺陷均在精确断言处变红 (RED)，恢复后恢复绿色 (GREEN)
- **验证关口全绿**：lint 0 · tsc 0 · build ✓ · **563/563 unit · 201/201 e2e**；4 张 VLM 验证截图；完整文档同步（PAD v2.13.0、SKILL v1.20.0、session_46/47、worklog）

后续建议：下个周期可再查 neo-crm 新会话、重跑引用扫描 + 已知问题 (Known-Issues) 清理，或开拓新的超集功能面。
