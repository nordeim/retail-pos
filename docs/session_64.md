继续执行 V32 修复周期（第 17 次审计循环；工作区第 7 次重置后全新克隆，发现 V31 已完成并推送——`08c9f4e` + 操作者的 `98485cb`/session_62 原始记录）。

环境重建：`.env`（DATABASE_URL="file:../db/custom.db"）、bun install（484 包）、db:push + db:seed（参考镜像：12 产品/6 分类/2 收银台/2 销售/2 班次）、chromium-1243（重置再次清掉浏览器缓存，与 V31 环境注记同款）。**基线门禁：lint 0 · tsc 0 · build ✓ · 587/587 unit（44 文件）· 219/219 e2e**——但首个全量 e2e 跑出 **F1c（v16 amber-600 像素读）单点失败**：隔离重跑 8/8 绿、全量重跑 219/219 绿、零代码变更——首次出现级 flake，按 V18/V26 标题竞态的观察态势记录（若复发则下轮根治；±1 通道色空间舍入边界为现行假设）。

本轮审计结论（第 17 周期）：
- **neo-crm 无前进**：仍为 `013232a`（session-199——V31 已采纳的同一提交；本轮无新教义）。
- 常设检查项全过：参考站第 17 周期无变化（$0.00/0/12/0 KPI、390×844 视口锁定、无汉堡）；克隆抽屉 spine 第 17 次精确匹配冻结 v25 账本（panel [0,0,288,844]、header [0,0,287,69]、nav [0,69,287,727]、footer [0,796,287,48]、close [235,16,36,36]、8 链接 y=81+44k、wordmark）——**无 Tailwind v4 bug，移动菜单按预期工作**（Esc + aria 复位实测）；V27 标题守卫探针 90/90（margin 7ms/7ms）；`bun audit` 无漂移（1 high = 已记录的 deepmerge-ts 拒绝项）；引用扫描干净；V31 治法存续复核（五处标签关联在位，全仓 Label 扫描零未关联）。
- **本轮素材**：V31 自己点名的"未来周期的登记册补全"（其 plan 决策 #8）——登记册覆盖全部公共表面 + shell/Dashboard + Ajustes 视图 + 抽屉 + 全部对话框打开态，但 8 个已登录视图中的 **6 个（Terminal、Inventario、Ventas、Cajas、Cajeros、Reportes）无关闭态登记**。
- **活体探针（neo-crm 先证后立纪律）**：临时规格以 smoke 同款 axe 配置驱动全部 6 个视图——**全部干净**。覆盖扩展形态：无活体缺陷，缺失的齿本身就是缺陷。探针规格删除（其路径转生为登记）。

TDD 执行：
- **B2 pins born-RED**：census 套件扩展（7→9 测试）——VIEW_REGISTRATIONS 清单（7 标题，NAME 形态）+ 每登记可见等待顺序守卫（标题 → 首个 toBeVisible → 首个 blockingViolations）。存量树上恰好 2 个新测试 RED 于首个缺失标题，7 个存量测试未动且绿。六个视图登记落入 smoke（字面量标题——循环生成标题永远匹配不上 NAME pin；导航规格 ROUTES 标题为挂载锚点），置于状态门控对之前；Ajustes 测试的过期注释改写为 V32 状态。census 9/9 绿；smoke 25 过。
- **B4 变异证明 ×2（各自精确命中再还原）**：(a) 渲染轴——摘除 cashiers 编辑按钮 aria-label → Cajeros 视图登记恰 RED 于 `button-name (critical): 1 nodes`（源码 pin 看不到的轴）→ 还原（git diff src/ 干净）→ 绿；(b) 登记轴——删除 Reportes 登记标题 → census 两个新测试恰 RED 于精确标题 → 还原 → 绿。途中教训：整文件 `git checkout` 还原连六个新登记一并回退——重新落位并复验（census + smoke 重跑绿），已记录于 plan §6。
- 全量门禁：**lint 0 · tsc 0 · build ✓ · 589/589 unit（44 文件，587+2）· 225/225 e2e（4.3m，零 flake——F1c 观察项未复发）**。零 src/ 变更（登记即治法）以字节证明：v32 同状态四张截图中三张与 v31 **字节相同**；抽屉图差异 9/329,160 像素（0.0027%，最大通道差 7——采集时字体栅格化噪声，v30→v31 先例同款形状；spine 几何本轮实测精确）。新主题截面 desktop-reports-1280（首次采集的亮 H1 表面）。
- 截图脚本 `scripts/capture-v32-shots.ts`（沿 v31 模式；Reports 700ms 沉降覆盖图表挂载）。

文档锁步：README（徽章 589+225 + Tested 行 + 登记册描述扩展至全部已登录视图）、AGENTS（test-suite rules 的视图登记册补全注记）、CLAUDE（v32 契约注，最新在前 + 计数）、PAD **v2.19.0**（历史条目 + **ADR-041** + §8 计数行）、SKILL **v1.26.0**（v32 收尾层在顶、v31 层降级于其交付计数 587/219 + 五处计数）、plan §6 已填、session_63（EN 工作日志）+ 本日志、worklog V32 条目。`.env.example` 核实未变且被追踪。每次文档编辑后重跑单元套件保持绿色（census pin 读取活体 spec）。

本地提交到 main 并经 SSH wrapper（`--remote git@github.com:nordeim/retail-pos.git`——V30 教训：wrapper 默认远端是过期的 task-management）推送——远端 == 本地 HEAD 已验证。

**本轮核心交付**：视图登记册补全（ADR-041）——登记册教义链（V24 登记册 → V29 公共表面补全 → V31 对话框打开覆盖）抵达终点状态：**每个公共表面 + 每个已登录视图 + 抽屉 + 每个对话框打开态**。六个视图获得关闭态登记（全部先探针证实干净——覆盖扩展形态，齿即治法）；census 新增 VIEW_REGISTRATIONS 清单（NAME 形态）+ 每登记可见等待顺序守卫（视图层 L-164c2 pin）；变异证明 ×2 于两轴；零 src/ 变更以三张字节相同截图证明。参考站第 17 周期无变化；抽屉 spine 第 17 次匹配（无 Tailwind v4 bug）；门禁 589 + 225 全绿。

**后续建议**：观察 F1c 像素读 flake 是否复发（若复发则根治）、复查 neo-crm 的 s199 后节奏、推迟的 Prisma 6→7 轮换（连带 deepmerge-ts 重分级）、或开拓新超集面。由您定夺。
