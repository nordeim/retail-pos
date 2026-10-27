我将继续执行 retail-pos 任务链。本轮提示词已递增更新（引用 `docs/session_17.md` + `docs/remediation-plan-v12.md` + `worklog.md` + `docs/session_18.md`），先刷新工作区并确认远端状态。
工作区已更新至 `5e7415c`（新增 `docs/session_18.md`）。现在检查本轮引用的四份文档是否存在：
四份文档齐全。`session_18.md` 是本轮新拉取的关键文档（描述本次会话要做什么）。先精读它和 session_17.md：
Session 17/18 已读——V12 周期已在 `0268bd8` 关闭并推送，`5e7415c` 是远端补录的 session_18 会话日志。本轮是 **V13 周期**。继续读 remediation-plan-v12 和 worklog 尾部：
V12 周期状态清晰：门禁全绿（lint 0 · tsc 0 · build ✓ · unit 429/429 · e2e 153/153）。Session_17 建议下一周期探索**悬停微交互**或**应用表面的深层扫描**。先检查工作区环境状态并读取 plan-v12 执行台账：
Plan-v12 的 B1-B6 批次已全部执行完毕。继续读执行台账尾部和核心文档：
Plan-v12 台账全绿。现在精读五份核心文档（刷新对项目契约和当前状态的理解）：
AGENTS.md 的 25 条契约已全部刷新。继续读 CLAUDE.md、README.md、PAD 和 SKILL 文档：
CLAUDE.md 已读——工作流契约清晰（lint → typecheck → build → test → test:e2e）。继续读 README 和 PAD：
PAD v2.0.0 版本史已确认。快速浏览 SKILL 文档版本头与结构，然后开始环境验证与基线门禁：
五份核心文档 + 四份会话文档已全部精读完毕。当前状态清晰：

- **V12 周期已关闭**（`0268bd8`）：auth 卡片 chrome、登录排版语法、英文子屏幕、平台重置页
- **门禁基线**：lint 0 · tsc 0 · build ✓ · unit 429/429 · e2e 153/153
- **本轮 = V13 周期**

现在验证环境并运行基线门禁（按 AGENTS.md 顺序 lint → typecheck → build → test）：
lint 0 · tsc 0 ✓。运行 build 和单元测试：
单元测试 429/429 全部通过。现在运行 e2e 测试套件（按 v12 教训先确认 ：3100 端口干净）：
**基线全绿：lint 0 · tsc 0 · build ✓ · unit 429/429 · e2e 153/153** —— V12 关闭状态完好。现在审计 v12 源码 diff：
Diff 与 plan-v12 一致。快速完成剩余 diff 审计并加载审计技能：
审计技能已加载（web-application 契约 + agent-browser + clone-app-pat-pro 方法论）。v12 diff 审计完毕——所有契约由 32 unit + 14 e2e 钉住，门禁全绿。

现在进入 V13 周期的**实况审计阶段**。按 session_17 建议，本轮探索：①参考站悬停微交互（社交图标 transform、图表悬停态）②应用表面深层扫描。先启动克隆的生产服务器并检查 agent-browser 工具：
服务器拒绝启动——生产模式要求 AUTH_SECRET。检查 .env 并显式传入环境变量：
.env 带的是示例 AUTH_SECRET（生产致命保护——设计如此）。查看 e2e 如何启动 standalone 服务器并复用该方式：
克隆探测服务器已在 ：3101 上线。现在用 agent-browser 登录参考站：
参考站登录成功（落在 `/` Terminal）。先重新验证参考站数据状态，然后开始 V13 新表面探测：
**参考站数据状态确认：与 v11/v12 完全一致**（KPIs $0.00/0/12/1，同样的 5 行甜甜圈图例，Atún Dolores 低库存行）——本轮无需种子数据工作。

现在开始 V13 核心探测——**图表悬停微交互**。先悬停参考站仪表盘的 7 天折线图：
图表只有 80px 宽——当前视口可能太窄（参考站自身的挤压问题）。设置标准桌面视口 1280×800 后重新测量：
视口原来是 390×844（移动端默认）。已改为 1280×800。用 IIFE 避免变量重复声明：
参考站 1280 视口下：折线图 625×280，圆环图 279×200。现在探测折线图悬停交互（tooltip 内容 + activeDot + 十字线）：
**关键发现——参考站折线图悬停可触发且有内容！** tooltip 文本 "sábventas : 0"（recharts 默认格式：x轴标签 + dataKey + " : " + 原始值）+ 1 个 activeDot + #ccc 十字线。深入测量 tooltip 完整结构：
**参考站 tooltip 完整结构已捕获**——recharts 默认内容格式：label `sáb` + item `ventas : 0`（原始值，无 $ 格式化），item 颜色 = 线色 #6366f1。这与 v11 钉住的皮肤（白卡/12px/10px/阴影）一致，但**内容格式是新的**。现在测 activeDot 的渲染：
**参考站 `activeDot`**：`<circle r="4" fill="#6366f1" stroke-width="2" stroke="#fff">` —— `recharts` 默认值。现在检查克隆的 `tooltip` 实现（`v11` 的 `ChartTooltip`）以及悬停行为：
克隆的 tooltip 是自定义两行结构（label + 格式化值），而参考站是 recharts 默认 item 行（系列名 + " : " + 原始值，行内颜色 = 线色 #6366f1）。继续测参考站 tooltip 的 label 颜色和 cursor 几何：
参考站测量确认：label 色 #e7e9ef（不可读——v11 已披露的平台 bug，克隆保持可读超集）、item 色 #6366f1、cursor 是 #ccc 垂直线（M342.5,5→L342.5,245，无宽度设置=默认1px）。现在读克隆的图表悬停实现：
克隆的图表悬停实现：**无 activeDot、无 cursor 线、tooltip 是自定义双行结构、定位在点上方居中**——与参考站有 4 处分歧。先精确测量参考站 tooltip 定位几何（wrapper 盒子 + 边缘翻转行为）：
精确几何已捕获：wrapper 100×76，offset (+10.5, -95)。怀疑 tooltip 是**鼠标指针锚定**而非数据点锚定（150 ≈ 指针y+10）。验证——同一 x 列不同 y 悬停，观察 tooltip 是否跟随鼠标：
wrapper 左侧稳定在点x+10（618），顶部跟随鼠标y+10。再做一次决定性测试——不同 x 位置悬停，区分点锚定与鼠标锚定：
决定性结论：**tooltip x = 吸附点x+10，y = 鼠标y+10**（混合锚定）。测试右边缘翻转行为（悬停最后一个数据点）：
**右边缘翻转确认**：最后一点 wrapper 翻到左侧（right=875=dot-10）。定位契约完整。现在尝试触发**甜甜圈图 tooltip**（v10/v11 遗留的“不可靠触发”披露）——用同样的合成 mousemove 技术：
线图的 tooltip 还挂着（未清除前一个悬停）。先对线图派发 mouseleave，再触发圆环图悬停：
线图 tooltip 未被 mouseleave 清除，圆环图 tooltip 仍隐藏且为空。检查圆环图的 wrapper 结构并直接在其容器上派发事件：
圆环图 tooltip wrapper 存在但为空（未激活状态）。PieChart 的悬停可能需要直接在扇区 path 上触发。直接对扇区派发事件：
**突破——圆环图 tooltip 成功触发！** 内容 "Lácteos : 2"。获取完整 HTML 结构：
**重大发现——圆环图 tooltip 是完全不同的皮肤！** 原始 recharts 默认：白底 + 1px #ccc 边框 + **无圆角无阴影** + 黑色 item 文字 + 空 label + "Lácteos : 2" 格式。而线图 tooltip 是定制皮肤（12px 圆角+阴影）。v11 把线图皮肤应用到了两个图表——这是本轮的核心发现。

继续测量：tooltip 字号 + 圆环扇区悬停状态：
字号：两个 tooltip 都是 **16px**（继承 body，克隆当前是 14px——需修正）。扇区无悬停态（无 transform/opacity 变化）。检查圆环 tooltip 的 transition 和线图底部翻转：
圆环 tooltip 也有 400ms transition。现在测第二族——**参考站登录页社交图标的悬停微交互**（上轮遗留的 known-open 披露）：
合成事件不触发 CSS :hover。用 agent-browser 的真实 hover 命令：
按钮 hover 态激活（bg slate-50 ✓ shadow-sm ✓ border slate-300 ✓），但**图标 transform 仍为 none**——参考站的 `transition-transform` 是死代码（无 group-hover 位移 utility）。验证 DOM 中确实无任何 group-hover 类：
**社交图标悬停变换确认不存在于参考站**（0 个 group-hover 类）——v12 披露准确，克隆已处于完全对等状态。此项 known-open 可在本轮文档中**结案**。

现在检查克隆端图表悬停的现状：
登录未跳转。检查种子默认密码和页面错误提示：
API 直接调用成功——问题在浏览器端。检查当前 URL 和页面实际状态：
控制台只有参考站的旧警告（Tailwind CDN），克隆端无 JS 错误。按钮文本保持 "Sign in"——submit 处理器从未运行。检查表单结构：
按钮在 y=796，视口高 800——按钮在折叠线下（v12 后卡片忠实复刻参考站自身的 908px 溢出）。设置更高的视口后重试：
克隆登录成功。进入 Dashboard 触发折线图悬停，对比参考站行为：
克隆用 `onPointerMove`（React 合成事件）——需要派发 PointerEvent：
克隆 tooltip 现状确认：内容 "sáb0"（无系列名无分隔符）、48px 宽、无 activeDot、无 cursor。现在触发克隆圆环图悬停对比：
克隆两个 tooltip 都用 v11 白卡皮肤——而参考站圆环图用原始默认皮肤。**核心发现族完整**。再扫一个候选表面——参考站 Reportes 的窗口切换 chips（7/14/30/90）交互状态：
参考站 chips 测量完成：激活态 = `bg-violet-600 text-white shadow-lg shadow-violet-500/30`，非激活 = `text-white/40 hover:text-white/70` 透明底。对比克隆：
克隆的报表标签页（reports chips）与参考站**完全一致**（含激活态 violet-600+shadow）——无需处理。最后核对两站仪表盘（dashboard）Y 轴标签格式与 tooltip 值格式的差异：
第一项测量跑在了克隆的 Reports 页（$ 标签 ✓ 30 天窗口 ✓）。参考站 Dashboard 图：Y 轴**纯数字 0-4 无 $**、X 轴星期名。现在测克隆 Dashboard：
克隆 Dashboard 标签与参考站完全一致 ✓。快速验证参考站 Terminal 的班次闸门状态（若可访问则可测产品卡悬停——上轮遗留披露）：
参考站 Terminal 仍被班次闸门挡住（产品卡悬停维持"不可观测"披露）。**V13 审计完成**——发现族集中在**图表悬停微交互**（5 个代码发现 + 2 个可结案披露）。检查 v11 tooltip 钉住的 e2e 契约（本轮需重新对齐的部分）：
v11 e2e 钉住已确认：线图钉（白卡皮肤+可读色+星期label）本轮**保持**；圆环钉（"Lácteos"+"2 productos"）需**重新对齐**。检查 v11 单元钉：
单元钉较轻（子串检查），基本保持。看圆环图当前悬停实现细节（写计划前最后一块拼图）：
实现拼图最后一块——克隆 SalesAreaChart 的布局常量（padTop/innerH，用于 cursor 的 y 跨度）：
布局常量确认（padTop=12, innerH=240, x(i)/y(v) 公式）。最后快速探测参考站仪表盘图例行和低库存行的悬停态，完成本轮扫描：
参考站低库存行无悬停态。快速确认克隆一致：
克隆低库存行 = 同样的 utility 集（LI vs DIV 标签差异，无悬停态——对等）。**V13 审计完成**。现在编写 remediation plan v13：
Plan 已保存。按任务链要求，先对照代码库验证计划的契合度（v11 钉的子串、e2e 断言、其他引用）：
v11 单元钉验证：皮肤正则将由 SalesTip 延续；组件名 ChartTooltip→SalesTip 需同步微调钉（记录为重对齐）。检查 inventory/terminal spec 对 "productos" 的引用是否受影响：
应用文案中的 "productos" 不受影响 ✓。计划验证完毕，开始 **TDD 执行——先写红钉**。先看 v12 单元测试的约定模式：
约定明确。现在写 v13 单元红钉：
16/16 单元钉红 ✓。检查 playwright 视口配置后写 e2e 红钉：
编写 v13 e2e 红钉：
现在重对齐 v11 的两个钉（leave 断言 + 圆环钉——随 v13 行为契约更新，不删除）：
实现阶段（B1+B2）。先检查 ChartTooltip 的所有引用点，然后重构 shared.tsx：
Tooltip 组件就位。现在更新 SalesAreaChart 的悬停状态与渲染：
SalesAreaChart 完成。现在更新 DonutChart：
两图表重构完成。修正 v13 单元钉的两个脆弱断言（DonutTip 切片边界 + 条件渲染正则），并重对齐 v11 单元钉的组件名：
TS 类型错误——回调 ref 的显式注解需放宽（早退返回 undefined）。修复：
v13 16/16 + v11 18/18 单元钉全绿，tsc 0 错误。运行完整单元套件和构建：
Unit 445/445（+16 新钉）+ build ✓。运行完整 e2e 套件（先确认 ：3100 干净）：
157/158 通过，1 个 v13 钉失败（activeDot+cursor 定位钉）。查看失败详情：
定位到根因：**竞态**——mouse.move 发生在图表数据加载完成之前（points 为空 → hover 状态为 null → 无 dot）。v11 钉的做法是先等数据渲染（area path 出现）。修复所有悬停测试：
根因明确：**垂直线的包围盒宽度为 0** → Playwright 判定 hidden（SVG line 的 stroke 不计入 bbox）。线实际存在且几何正确（x1=x2=332.5, y 12→252, #ccc）。改用存在性断言（几何随后有独立断言，非弱化）：
Chromium 将 `400ms` 序列化为 `0.4s`。修正断言：
v13 e2e 6/6 全绿。运行完整 e2e 套件验证无回归：
完整 e2e **158/158 全绿**（153 + 5 新钉）。快速核对新钉数量与单元总数：
确认：5 个新 e2e + 16 个新单元钉。门禁状态：**lint 0 · tsc 0 · build ✓ · unit 445/445 · e2e 158/158**。

现在重启探测服务器（新构建）做实况对等验证 + 证据截图：
线图悬停实况验证**全部匹配参考站**（"sábventas : 0" · 16px · #6366f1 item · r4 dot · #ccc cursor）。验证圆环图：
圆环 tooltip 实况验证**精确匹配**（"Lácteos : 2" · 1px #ccc 边框 · 0px 圆角 · 无阴影 · 黑色 item · transform 数学完全吻合——翻转生效）。

现在拍摄悬停证据截图。先看现有截图脚本的约定：
编写悬停证据截图脚本（沿用仓库截图脚本约定）：
平线 $0 的区域路径零高度 → Playwright 判 hidden。改用 attached 等待（与 e2e 的 toHaveCount 一致）：
`waitFor()` 默认 state 是 "visible"——需显式 "attached"：
截图已捕获。做像素级验证（v10/v12 教训：VLM 声明需像素结算——直接用程序化像素检查）：
圆环截图验证通过（白卡+33 个 #ccc 边框像素）。图表截图的 tooltip 在（780 白像素）但 cursor 未检出——可能是 1px 线的抗锯齿混色。放宽匹配重查：
**像素级验证全部通过**：cursor（列 353，235px 灰色竖线）+ activeDot（301 靛蓝像素）+ 两个 tooltip 白卡。静止 UI 无变化——现有 23 张截图集保持有效。

进入文档同步阶段。先写 AGENTS.md 契约 26：
AGENTS.md 契约 26 完成。更新 CLAUDE.md（计数 + v13 块）：
第二处编辑误删了 v12 块的标题行——修复（v13 块后恢复 v12 头）：
CLAUDE.md 修复完成。更新 README 徽章和测试计数：
README 完成。更新 PAD（版本史 v2.1.0 + ADR-023 + §8 计数）。先看 ADR-022 和 §8 的位置：
PAD 版本史和计数完成。添加 ADR-023 到 ADR 索引表：
ADR-023 已插入。更新 SKILL 文档至 v1.8.0：
SKILL 文档 e2e 计数还有两处陈旧的 127/127（v10 时代）——修正为 158：
文档同步接近完成。填充 plan-v13 执行台账：
编写 session_19.md 会话日志：
Session 日志完成。执行“数清事物”检查（陈旧计数扫描）：
SKILL 计数已修正（worklog 831 行是 v12 的历史记录，保留）。追加 V13 工作日志条目：
Worklog 已追加。运行最终完整门禁（提交前）：
v8 spec 出现 1 个失败（from_url 往返——我本轮未触碰 auth/redirect 代码，疑似已记录的顺序性 flake）。单独重跑确认：
单独运行 8/8 通过——确认为已记录的顺序性 flake。重跑完整套件确认：
第三次完整运行 **158/158 全绿**。检查第二次运行失败的是哪个 spec（排查 flake 模式）：
套件最终全绿（158/158，前两次的间歇失败确认为已记录的顺序 flake——隔离运行通过 + 最终全绿）。准备提交。先停探测服务器、检查 git 状态：
变更集完全是 v13 范围。查看 SSH wrapper 推送文档（上轮用了 paramiko shim 方案）：
流程明确。先提交 v13 变更集：
提交 `214e196` 已创建。现在通过 SSH wrapper 推送。先物化密钥并检查 ssh 可用性：
查看上轮会话是否已创建 shim，然后物化密钥：
Dry-run 干净（`5e7415c..214e196 → main`，远端无分叉）。执行真实推送：
**V13 周期完成并已推送**（`214e196` → main，远端已验证，密钥已粉碎，工作树干净）。按协议更新工作区级 worklog：
**V13 周期已完成并推送**（`214e196` → main，远端验证 ✓，密钥已粉碎）。

本轮成果：
- **审计突破**：合成事件探针首次解锁了参考站图表悬停态的 headless 测量（含圆环图扇区路径触发技巧）
- **5 个发现族修复**（TDD，16 单元 + 5 e2e 新钉）：#ccc 游标线、r-4 活跃圆点、recharts 默认 tooltip 内容语法（`ventas : 原始值`）、混合锚定+左翻转+400ms 滑动+持久化 wrapper、圆环图专属原始皮肤
- **2 项披露结案**：社交图标悬停变换（参考站死代码，已对等）、圆环图 tooltip 可触发
- **门禁全绿**：lint 0 · tsc 0 · build ✓ · 445/445 unit · 158/158 e2e

建议下一步：在两站 Dashboard 并排悬停图表对比滑动效果；下周期可探索侧边栏折叠动画、对话框过渡或带真实销售数据的报表页深扫。
