# Optimizing Java：把性能调优写成一本书

> 主题：《Optimizing Java》（O'Reilly，Chris Newland 合著）
> 适用场景：从单点工具走向体系化的 JVM 性能调优方法论

> byte-me.dev 上「Optimizing Java」按钮目前指向：https://www.chrisnewland.com/optimizing-java（**该页面已失效**，显示 Page not found）
> 书的真实归宿（O'Reilly）：https://www.oreilly.com/library/view/optimizing-java/9781492039259/
> Chris 个人站 Java 分类（他的实际 Java 写作）：https://www.chrisnewland.com/tagged/java
> 适用场景：把这些工具串成体系，从「会用单个工具」走向「懂 JVM 性能方法论」

## 0 写在前面

前面九篇，我们逛完了 Chris Newland 的整套工具：字节码（Byte-Me）、JIT（JITWatch + hsdis）、参数（VM Options Explorer + JaCoLine）、内建函数（Intrinsics Explorer）、GC（GC Explorer）、路线图（JEP 三件套）。工具很多，但你可能会问：它们之间到底怎么连成一条调优思路？答案的另一半，在他合著的那本书里——《Optimizing Java》。

先说一个**真实情况**：byte-me.dev 顶部那排按钮里第 11 个「Optimizing Java」，目前点击会跳到 https://www.chrisnewland.com/optimizing-java——但**这个页面已经不存在了**，显示「Page not found, Oops, the page you asked for does not exist」。Chris 的个人站是 JS 渲染的 SPA，似乎经过了一次重构，对应路径迁移了。书本身的官方归宿是 **O'Reilly** 平台（O'Reilly 的反爬较严，直接抓取会被 Access Denied 挡住）。

所以我用 Chris 个人站的 Java 分类页 https://www.chrisnewland.com/tagged/java 作为配图——这张图渲染了他真实在写的 Java 文章流：

![Chris Newland 个人站 Java 分类页：他的真实写作（包括 JITWatch、GC pause 排查、HotSpot escape analysis 等，构成了 Optimizing Java 的思想源头）](/images/series/jvm-tools/10-optimizing-java.png)

可以看到他写过的代表性文章：

- *Identify the Java Thread taking the most CPU*
- *Quickly find worst GC pauses in G1 and Parallel GC logs*
- *JITWatch on ARM (Raspberry Pi)*
- *JITWatch hits 1000 stars on GitHub*
- *JITWatch lock elision report*
- *New JITWatch sandbox example – no partial escape analysis*
- *Updated instructions for building hsdis on OSX*

这一篇篇 blog post，就是《Optimizing Java》这本书的思想源流——把分散的实战经验系统化成方法论。


## 1. 问题背景：工具是零件，方法论才是引擎

书里给的方法论，核心是把多个工具按「测量 → 归因 → 验证」串成一条固定的诊断链（后文第 3 节给出完整版）；测量的环节离不开 JMH——一个专门做 Java 微基准测试的框架，能精确测出「这段代码到底多快」而不被 JVM 优化骗到；归因的环节则靠 profiling（在程序运行时采集「时间花在哪、内存用在哪」来定位瓶颈）。

单个工具能回答「这个参数是干嘛的」「这个方法被内联了吗」，但真实性能问题往往是复合的：GC 停顿、JIT 没优化、锁竞争、intrinsic 没命中、容器内存配错……要系统性地诊断，需要一套**从测量到归因到验证**的方法论，而不是东用一个西用一个工具。

《Optimizing Java》（O'Reilly，ISBN 9781492039259）由 **Ben Evans、James Gough、Chris Newland** 合著。Chris 是这三人中最深入 HotSpot 源码层的——他写的 JITWatch、hsdis 包装、字节码 / intrinsics 工具构成了他那一半内容的方法论载体。

## 2. 设计理念：从「看清楚」到「调得对」

如果把前九篇的工具看成「显微镜」，这本书就是「使用显微镜的教科书」。它的核心主张很朴素：

- **先测量，再调优**。没有基线数字，所有「优化」都是玄学。JITWatch、GC 日志、JMH 基准测试是第一手证据。
- **理解 JVM 各层的权衡**。堆大小、GC 选择、JIT 编译阈值、内联策略，彼此牵制，没有银弹。
- **区分「语言层」和「运行时层」**。很多慢，不在你写的算法，而在 JVM 怎么编译、怎么回收、怎么调度（这正是 intrinsics / JIT / GC 三篇的价值）。

## 3. 把工具串成一条诊断链

![从工具到方法论：测量 → 归因 → 验证，一条可复用的调优链](/images/series/jvm-tools/10-tools-to-method.svg)

书里的方法，落到前九篇工具上，是一条可复用的排查链（这是本系列最重要的 deliverable）：

```
现象：接口 P99 抖
   ↓
1. 抓 GC 日志 + 用 GC Explorer 确认选的回收器是否合理   → 工具（九）
   ↓
2. 用 JITWatch 看热点方法有没有被内联 / 退回解释执行    → 工具（四）
   ↓
3. 必要时配 hsdis 看汇编，定位 SIMD / intrinsic 是否生效 → 工具（三）
   ↓
4. 用 VM Options Explorer 核对当前参数含义 / 可用性     → 工具（二）
   ↓
5. 用 JaCoLine 体检启动脚本，找拼错 / 废弃 / 冲突参数   → 工具（五）
   ↓
6. 怀疑标准库慢？用 Intrinsics Explorer 确认踩中 / 没踩中 → 工具（八）
   ↓
7. 用 Byte-Me 看关键代码编译产物，验证语言层假设       → 工具（六）
   ↓
8. 升级前用 JEP 三件套 + differences 页评估影响         → 工具（七）、（二）
```

这条链，就是《Optimizing Java》方法论的「工具化落地版」。你不需要背任何配置黄金组合——按这条链走，每一步都有对应的免费工具给出依据。

## 4. 书的章节骨架

```text
第 1 章  性能与可理解性：超越迷信、传说与民间传说
第 2 章  JVM 概览
第 3 章  硬件与操作系统：当代主流硬件简介
第 4 章  性能测试模式
第 5 章  微基准测试与 JMH
第 6 章  理解垃圾回收
第 7 章  内存分配与垃圾回收调优
第 8 章  JIT 编译
第 9 章  JIT 编译调优
第 10 章 高性能应用中的并发
第 11 章  profiling 与监控
第 12 章 性能分析案例
```

第 8、9 章讲 JIT 编译——你能在 JITWatch（四）+ hsdis（三）里看到对应的工具。第 6、7 章讲 GC——对应 GC Explorer（九）。第 5 章讲 JMH——这是书里直接给的微基准工具，跟本系列互补。Chris 那一半内容主要落在 JIT 章节和 profiling 章节。

## 5. 怎么用这本书 + 本系列

**两种读法**：

- **快速路径（用本系列当 index）**：先看本系列 10 篇建立全景认知，再回到书里深入你想专攻的章节（比如调 GC 性能就先啃第 7 章）。
- **系统路径（先书后工具）**：把书通读一遍做基础，然后每遇到一个具体问题，回到本系列对应章节查工具。

**配套节奏**：每章读完，建议用本系列对应工具做一个 mini-experiment。比如读完第 8 章（JIT），打开 JITWatch 加载你自己代码的 `LogCompilation`，对比书里的图；读完第 7 章（GC），用 GC Explorer 查你目标 JDK 的可用 GC，再去翻一遍你的启动参数。

## 6. 实际应用示例：把链走一遍

场景：线上服务 P99 从 50ms 抖到 300ms。

1. **第一步（GC）**：抓 `-Xlog:gc*:file=gc.log:time,uptime,level,tags`，看 GC Explorer（九）确认你当前 GC 设置是否合理（堆够不够、停顿目标达不达）。
2. **第二步（JIT）**：开 JITWatch 跑一段负载，看 Suggestion 面板是否有「内联失败热点」「代码缓存满」「deopt 聚集」。
3. **第三步（汇编）**：如果有内联失败，配 hsdis 看那段代码的真实汇编——是不是走到了 megamorphic call site（`invokeinterface` 没去虚拟化）。
4. **第四步（参数）**：用 VM Options Explorer（二）核对启动参数含义。
5. **第五步（脚本体检）**：JaCoLine（五）跑一遍启动脚本。
6. **第六步（intrinsics）**：怀疑某标准库方法慢？Intrinsics Explorer（八）查是不是没踩中 intrinsic。
7. **第七步（语言层）**：Byte-Me（六）看关键代码的字节码，是否符合预期。

**这本书教你的，就是这条链的完整理论支撑 + 真实案例。**

## 7. 与本系列各篇的关联

| 本系列文章 | 在书中对应章节 |
|---|---|
| （二）VM Options Explorer | 第 2、9 章（参数、JIT 调优） |
| （三）hsdis + （四）JITWatch | 第 8、9 章（JIT 编译 + 调优） |
| （五）JaCoLine | 第 9、10 章（启动参数、并发场景） |
| （六）Byte-Me | 第 2 章（JVM 概览：字节码） |
| （七）JEP 三件套 | 第 2、12 章（演进、案例） |
| （八）VM Intrinsics | 第 8 章（JIT 编译：intrinsic） |
| （九）GC Explorer | 第 6、7 章（GC、调优） |
| （十）Optimizing Java | 本篇（方法论收尾） |

## 8. 注意事项

- 书的英文版有出版年份（首版 2016、后续有更新），部分 JVM 细节随版本演进——读时结合你所用 JDK 的当前行为。
- 方法论强调「测量驱动」，别把书里某个具体参数当永恒真理——用 VM Options Explorer 查它的当前状态。
- 工具是辅助理解，不是替代思考；真正调优靠你对自己业务负载的建模。
- O'Reilly 平台对无头浏览器有反爬，本篇配图没用 O'Reilly 页面——而是用 chrisnewland.com/tagged/java 作为「作者的 Java 写作流」证据。

## 9. 系列收尾

从（一）总览那张地图，到这一篇方法论收尾，我们走完了一条完整的 HotSpot 认知链路：

```
字节码 → JIT → 参数 → intrinsics → GC → 路线图 → 体系化调优
Byte-Me  JIT  VM+J   Intrinsics   GC   JEP三件套  Optimizing Java
 (六)  (三)(四) (二)(五)  (八)     (九)   (七)        (十)
```

Chris Newland 一个人把这些「黑盒」拆成了看得见的工具，而你能做的，是用它们把自己的系统看得更清楚一点。

**如果只想记住一句话**：遇到 JVM 看不懂的地方，先去 byte-me.dev 和 chriswhocodes.com 找对应工具——大概率已经有人替你拆好了。

## 参考链接

- 《Optimizing Java》O'Reilly 官页：https://www.oreilly.com/library/view/optimizing-java/9781492039259/
- Chris Newland 主页：https://www.chrisnewland.com/
- Chris Newland Java 分类文章流：https://www.chrisnewland.com/tagged/java
- byte-me.dev 总入口：https://byte-me.dev/
- VM Options Explorer：https://chriswhocodes.com/vm-options-explorer.html
- JITWatch GitHub：https://github.com/AdoptOpenJDK/jitwatch