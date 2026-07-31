# JEP 三件套：摸透 Java 的演进路线图

> 工具：JEPMap / JEPSearch / FullJEP（chriswhocodes.com）
> 适用场景：按项目、版本、全文三种维度检索 JEP，摸清 Java 特性演进路线

> 真实地址：
> - JEPMap（按项目/版本导航）：https://chriswhocodes.com/jepmap.html
> - JEPSearch（筛选检索）：https://chriswhocodes.com/jepsearch.html
> - FullJEP（全文搜索）：https://chriswhocodes.com/fulljep.html
> 适用场景：按项目/版本/关键字追踪 Java 增强提案，评估某个特性的成熟度

你想搞懂「虚拟线程到底落地到哪一步了」，去 https://openjdk.org/jeps 翻——好家伙，几百条 JEP 平铺在一页，按编号排，根本看不出「Loom 项目有哪些、各自什么状态」。JEP 是 Java 每次加新功能（虚拟线程、record、switch 表达式……）要先提的一份提案，是 Java 演进的基本单元；而 OpenJDK 把相关的 JEP 归到「项目」里——比如 Loom 管并发（虚拟线程），Valhalla 管值类型，ZGC 是那个超低延迟 GC，Panama 管原生互操作，Amber 管语言小特性。Chris 的 JEP 三件套（JEPMap / JEPSearch / FullJEP）就是给这份路线图做了三种不同视角的索引——共享同一份数据源（自动从 openjdk.java.net 解析），但提供不同入口。


## 1. 问题背景：JEP 列表「全但难用」

JEP（JDK Enhancement Proposal）是 Java 演进的基本单元，但官方列表有两个痛点：

- **平铺无归类**：几百条按编号排，你看不出它们属于 Amber（语言小特性）、Loom（并发）、Valhalla（值类型）、ZGC、Panama（原生互操作）等项目。
- **检索弱**：想找「所有和虚拟线程相关的 JEP」「JDK 21 到底交付了哪些」，得手动翻。

JEP 的状态机也不直观：

```
Draft → Submitted → Candidate → Proposed to Target → Targeted →
Integrated → Completed
                                        ↓
                              Withdrawn / Delayed / Closed / Replaced
```

理解这串状态变化才能判断「这个特性能不能在生产用」。

## 2. 三件套的真实长相

![JEP 三件套：同一数据源，三种视角（JEPMap 导航 / JEPSearch 检索 / FullJEP 深挖）](/images/series/jvm-tools/07-jep-trio.svg)

### 2.1 JEPMap：按项目 / 版本导航

打开 https://chriswhocodes.com/jepmap.html，页面顶部说明数据自动生成算法：

1. 解析 `openjdk.java.net/jeps`
2. 对每个 Project，解析项目页和 wiki 页找 JEP 链接
3. 校验 JEP 讨论邮件列表是否匹配 Project
4. 把 JEP 的 `Release` tag 映射回对应 JDK
5. 移除 banlist 中的项

页面主体是一张**项目 × JEP** 的可点击地图，每个项目是一个 anchor：

![JEPMap：项目版本导航 + Amber 项目展开后的 JEP 列表](/images/series/jvm-tools/07-jepmap.png)

可见项目涵盖：Amber、Babylon、Brisbane、Code Tools、JDK7~JDK26、Jigsaw、Lanai、Leyden、Lilliput、Loom、Memory Model Update、Multi-Language VM、Nashorn、New I/O、OpenJFX、Panama、Port: AArch32 / AArch64 / PowerPC-AIX / RISC-V / s390x、Shenandoah、Skara、Valhalla、ZGC。

展开 Amber 后能看到 JEP 286（var 类型推断，JDK 10）、JEP 301（Enhanced Enums）、JEP 302（Lambda Leftovers）等历史里程碑。

### 2.2 JEPSearch：可筛选的 JEP 表格

打开 https://chriswhocodes.com/jepsearch.html，是一张可搜索、可筛选的大表：

![JEPSearch：可筛选的 JEP 表格](/images/series/jvm-tools/07b-jepsearch.png)

列：Number / Name / Issue / Status / Created / Updated / Release / Discussion / Related / Depends / Projects。

筛选维度：Status 下拉（Show All / Delivered / Proposed to Target / Candidate / Submitted …）、Release 下拉、Projects 下拉、顶部关键字搜索框。

例子：搜 JEP 446（Scoped Values Preview）→ Status: Closed / Delivered，Release: 21，Projects: loom-dev。

### 2.3 FullJEP：单 JEP 全文搜索

打开 https://chriswhocodes.com/fulljep.html 是一个基于 **WebSocket** 的全文搜索界面：

![FullJEP：WebSocket 全文本搜索界面](/images/series/jvm-tools/07c-fulljep.png)

绿色「Connected」表示 WebSocket 已连上。输入关键字后实时从服务端拉相关 JEP 的全文命中。这条接口对「想搜某段讨论文本到底出现在哪些 JEP 里」的考古场景特别有用。

## 3. 怎么用：真实操作流程

### 3.1 追一个项目的全貌

场景：你想看 Loom（虚拟线程项目）所有 JEP 及其状态。

1. 打开 JEPMap。
2. 点页内导航里的 **Loom** 锚点，跳到 Loom 区块。
3. 看到 JEP 444（Virtual Threads, JDK 21 Delivered）、JEP 436（Virtual Threads v2）、JEP 453（Structured Concurrency Preview）等一串。
4. 每条都标注状态——Delivered 就能用，Candidate / Proposed to Target 还不够稳。

### 3.2 看某版本交付了什么

场景：准备升级到 JDK 21，先列清单。

1. JEPMap 顶部点 **JDK21** 锚点。
2. 列出该版本 Targeted/Delivered 的所有 JEP。
3. 重点看对你的代码有影响的：`JEP 431 Sequenced Collections`、`JEP 440 Record Patterns`、`JEP 441 Pattern Matching for switch`、`JEP 444 Virtual Threads` 等。

### 3.3 评估一个特性的成熟度

场景：要不要在生产用 `ScopedValue`（JEP 446）？

1. JEPSearch 搜 `ScopedValue` 或 `446`。
2. 看 Status：Closed / Delivered = 已交付。
3. 但 Delivery 不等于稳定——再点进 FullJEP 搜 `ScopedValue` 看讨论历史，看有没有 `Preview`、`Incubator` 字样（Preview 在每个版本可能改语法，Incubator 还在实验阶段）。
4. 综合判断能不能现在就押注。

### 3.4 全文考古

场景：想知道某个 API 设计有没有被早期 JEP 讨论过。

FullJEP 的 WebSocket 接口输入关键字，命中 JEP 正文里的所有出现位置。比官方 search 更全（官方只搜标题 + 部分元数据）。

## 4. 实际应用示例

### 4.1 跟踪 Panama 进展

JEPMap → Panama → 看 JEP 424（Foreign Function & Memory API Preview, JDK 19/20/21）、JEP 434（Foreign Function & Memory API Second Preview, JDK 20）、JEP 442（Foreign Function & Memory API Third Preview, JDK 21）。三连预览说明 API 在打磨，可以尝试但别押注。

### 4.2 看 Leyden

JEPMap → Leyden → 看 JEP 483（Class-File API）、JEP 472（Prepare to Restrict the Use of JNI）。Leyden 是 2023 年才正式启动的新项目，主要解决启动时间和预热开销。

### 4.3 评估 Shenandoah 是否该用

JEPMap 顶部点 Shenandoah → JEP 404（Shenandoah GC Production, JDK 15 Delivered）。状态显示已 Delivered——可以用，但和 G1 / ZGC 怎么选，还是 GC Explorer（九）的事。

## 5. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| Byte-Me（六） | **强关联**。Byte-Me 示例库里每条都引用对应 JEP——用 JEPMap 找特性，用 Byte-Me 看特性的字节码实证。 |
| VM Options Explorer（二）/ hotspot_option_differences | JEP 落地后常伴随新参数（`UseCompactObjectHeaders` 来自 Valhalla 相关 JEP）。JEP 改变行为，参数随之变化。 |
| GC Explorer（九） | GC 的可用性变化通常由 JEP 驱动（JEP 377 ZGC Production → GC Explorer 里 Z 列从 Y 变多）。 |
| VM Intrinsics Explorer（八） | 新 intrinsic 常随 JEP 一起引入（如 Vector API JEP 338 带来了大量 vector intrinsics）。 |
| Optimizing Java（十） | 书里讨论的每个特性都能在 JEPMap 里找到原始提案。 |

## 6. 注意事项

- 数据自动解析官方页生成，作者明确说「Autogeneration can produce false positives」，重要结论回官方 JEP 页（`https://openjdk.org/jeps/<id>`）核实。
- Preview 特性在不同版本可能改语法，看 JEP 时留意「Targeted / Delivered 版本」和「Preview 几」。
- JEP 状态会变，长期跟踪以官方为准。
- FullJEP 用 WebSocket 直连服务端，客户端脚本需要能连 WebSocket（公司网络可能阻断）。

## 7. 小结

JEP 三件套让你看见「Java 往哪走」。但 JVM 里还有一种「看不见的优化」——你写的方法，HotSpot 压根没执行你写的字节码，而是偷偷换成了手写汇编。下一篇 VM Intrinsics Explorer（八）揭这个谜。

## 参考链接

- JEPMap：https://chriswhocodes.com/jepmap.html
- JEPSearch：https://chriswhocodes.com/jepsearch.html
- FullJEP：https://chriswhocodes.com/fulljep.html
- OpenJDK JEP 官方索引：https://openjdk.org/jeps
- OpenJDK Projects 列表：https://openjdk.org/projects/