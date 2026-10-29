继续执行 V31 修复周期（第 16 次审计循环；工作区第 6 次重置后全新克隆，发现 V30 已完成并推送——`1885f71` + 操作者的 `f2f2dd7`/session_59 原始记录）。

环境重建：`.env`（DATABASE_URL="file:../db/custom.db"）、bun install（484 包）、db:push + db:seed（参考镜像：12 产品/6 分类/2 收银台/2 销售/2 班次）、chromium-1243（重置清掉了浏览器缓存，重装后恢复）。**基线门禁一次全绿：lint 0 · tsc 0 · build ✓ · 580/580 unit（43 文件）· 207/207 e2e（3.7m，零 flake）**——与 V30 收尾完全一致。

本轮审计结论（第 16 周期）：
- **neo-crm 前进一个提交**：`56deef8` → `013232a`——**session-199「A11Y 登记册的对话框打开态覆盖率审计」**，全文精读后采纳：F-172c 判据（Radix Dialog 关闭时内容不在 DOM 内，故每个对话框打开态都应拥有自己的登记）；D-199a1（登记册扩展 + 可见等待守卫 + NAME 形态的登记普查 pin）；D-199a2（规格自身过期计数声明）；被拒清单（同组件编辑态、popover 开态、注册表 major）划定范围。
- **本轮自己的活体抓取（s199 职责映射到本仓库，首次运行）**：临时探针规格驱动全部 14 个对话框打开态 + 8 个已登录视图的关闭态，跑 smoke 同款 axe 配置 → **5 个 critical `button-name` 违规**：产品对话框（Categoría + Unidad 两个 SelectTrigger）、Abrir Turno 对话框（Cajero/a）、Ajustes 视图自身（Moneda + Proveedor）。其余 9 个对话框与 7 个视图全部干净。根因同型：无 `htmlFor` 关联的 `<Label>` 压在 Radix `SelectTrigger`（渲染为无障碍名称缺失的 `<button>`）之上。治法惯用法先活体验证再采纳：一处探察性关联后注入 axe-core 4.10.2 单跑 button-name——被修节点恰好从违规清单消失；随后还原以保 born-RED 纪律。
- 参考站第 16 周期无变化（$0.00/0/12/0 KPI、平坦图表、390×844 视口锁定、无汉堡）。
- 克隆站抽屉 spine 第 16 次精确匹配冻结账本（panel [0,0,288,844]、nav [0,69,287,727]、footer [0,796,287,48]、close [235,16,36,36]、8 链接 y=81+44k）——**无 Tailwind v4 bug**；Esc + aria 复位实测通过。
- 引用扫描干净；V27 标题守卫探针重跑 90/90 干净（30 自然 + 60 fast-auth；margin 5ms/7ms——竞态形状仍在，guard 每次纠正）；`bun audit` 无漂移（1 high = 已记录的 deepmerge-ts 拒绝项）。

TDD 执行：
- **B2 pins born-RED**：census 套件 `tests/a11y-register-census.test.ts`（7 测试）——6 个在存量树上 RED（守卫契约 pin + 五个标签对 pin）；inventory NAME pin 随登记册同时诞生（s199 形态，其齿由 B4 删除变异证明）。扩展的 smoke：产品对话框登记 RED 于 `button-name (critical): 2 nodes`、shift-open RED 于 1 node、Ajustes 视图扫描 RED 于 2 nodes；其余 9 个登记 born-green；7 个存量测试全程未动且绿。探针规格删除（其打开路径转生为登记）。
- **B3 治法——途中的探针陷阱发现**：五个标签关联（htmlFor + id）落位后重建，smoke 19/19 全绿。但 census 的 Moneda pin 治后仍 RED——**朴素注释剥离器的 `accept="image/*"` 陷阱**：正则把 `image/*` 属性里的 `/*` 当注释起点，幻影块注释一路吞到下一个真实 `*/`（第 199→284 行），Moneda 标签恰在吞没区内。node readFileSync 证明原始文件正确，缺陷定位在剥离器本身。治法：QUOTE-AWARE 剥离器（字符串字面量内的 `/*`/`//` 永不剥离）。存量套件同陷阱下验证非空转（title-guard 两文件无字符串内嵌 `/*`；account-ui 34 个正则 pin + toContain pin 零个落入幻影区；且该陷阱的失败形态是响亮的假 RED，绝非假绿）。
- **B4 变异证明 ×2（各自精确命中断言再还原，零波及）**：(a) 摘除产品 Categoría 标签的 `htmlFor`（本轮缺陷原形状）→ 产品对话框登记恰 1 RED 于渲染树 `button-name: 1 nodes`（源码 pin 看不到的轴——s199 变异轴）；(b) 删除一个登记标题（ticket modal → REDACTED）→ census inventory pin 恰 1 RED。还原后全量门禁：**lint 0 · tsc 0 · build ✓（仅存档 V26 boot-guard 警告）· 587/587 unit（44 文件，580+7）· 219/219 e2e（4.2m，零 flake）**——标签关联的零像素位移由全量视觉电池重跑绿证明。五张 v31 截图 PNG 校验于精确尺寸（desktop-product-dialog-1280——本轮主题，512×642 对话框元素；其余四张与 v30 同种子态字节稳定——关联修复的惰性肉眼可见于字节）。
- 截图脚本备注：对话框沉降用 500ms 纯等待（getAnimations().finished 会在取消的动画上 reject——截屏的稳定形态）。

文档锁步：README（徽章 587+219 + Tested 行 + 登记册描述扩展至对话框打开态覆盖）、AGENTS（对话框打开登记职责 + 标签关联惯用法 + 剥离器陷阱注）、CLAUDE（v31 契约注，最新在前 + 计数）、PAD **v2.18.0**（历史条目 + **ADR-040** + §8 计数行）、SKILL **v1.25.0**（v31 收尾层在顶、v30 层降级 + 五处计数 + **§12 F15 教训**）、plan §6 已填、session_60 + 本日志、worklog V31 条目。`.env.example` 核实未变且被追踪。每次文档编辑后重跑单元套件保持绿色（census pin 读取活体 spec）。

本地提交到 main 并经 SSH wrapper（`--remote git@github.com:nordeim/retail-pos.git`——V30 教训：wrapper 默认远端是过期的 task-management）推送——远端 == 本地 HEAD 已验证。

**本轮核心交付**：对话框打开态 a11y 覆盖率审计（ADR-040，neo-crm session-199 教义采纳）——登记册的另一半盲区获得常设齿。首次活体普查抓到 5 个 critical `button-name` 违规（三处表面、同一根因：无关联 Label 压 SelectTrigger），以 htmlFor+id 关联惯用法治愈（axe 活体验证、零像素位移、披露的交互超集——标签点击现可聚焦选择器）；12 个新登记（11 对话框打开态 + Ajustes 视图关闭态，含带状态复原的开班门控对）+ 7 个 census pin（NAME 形态清单 + 守卫契约 + 五个标签对）；变异证明 ×2；途中的剥离器陷阱（`accept="image/*"` 幻影注释）作为 F15 教训入册。参考站第 16 周期无变化；抽屉 spine 第 16 次匹配（无 Tailwind v4 bug）；门禁 587 + 219 全绿。

**后续建议**：未来周期可完成七个干净视图的关闭态登记、复查 neo-crm 的 s199 后节奏、推迟的 Prisma 6→7 轮换，或开拓新超集面。由您定夺。
