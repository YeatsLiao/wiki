# JVM工具解读 · 总览：一个人，一套 HotSpot 内部机制拆解工具矩阵

> 工具矩阵：byte-me.dev / chriswhocodes.com / jacoline.dev（12 个入口）
> 适用场景：建立整套 JVM 工具的全局地图，按「你会在哪一层卡住」选工具

如果你写过 Java 服务，大概率见过启动脚本里一长串 `-XX`、`-Xms`、`-Xmx`、`-XX:+UseG1GC`、`-XX:MaxGCPauseMillis`——有些是历史遗留配置，有些是前同事加的，有些你天天见却从没认真问过：它在 JDK 11 里默认值是多少？还有效吗？换发行版会变吗？

更头疼的是 HotSpot 内部的复杂性：你写的 Java 先被编译成字节码，运行时由 JIT 把热点代码翻译成机器码。但为什么某个方法没被内联？`Math.sin`、`Arrays.equals` 为什么能这么快？JVM 还要在后台默默做 GC——自动清理不再使用的内存。

这些「没人说得清」的事，被 Chris Newland（网名 @chriswhocodes，伦敦的金融软件开发者）用业余时间拆成了十几个能直接在浏览器打开、能搜索、能对比的工具。他 1999 年在 Nortel 做移动代码研究，2004 年转进金融市场写高频低延迟系统，性能成了日常命题；2013 年被 HotSpot 的 JIT 吸引，读完《The Well-Grounded Java Developer》后决定自己动手——JITWatch 由此诞生。

十多年后，这套工具覆盖了理解 JVM 的几乎每一个视角，全部免费、开源、一个人维护。据说 Oracle 内部的 JVM 团队都在用他的 JITWatch。

打开 byte-me.dev，页面顶部那排 12 个蓝底按钮，就是这套「HotSpot 内部机制拆解工具矩阵」的总入口。这一篇不深入任何一个工具，而是把整张地图摊开：每个按钮对应哪个真实地址、覆盖 JVM 哪一层、彼此怎么串联。

![byte-me.dev 总入口（顶部 12 个按钮即整套工具的导航）](/images/series/jvm-tools/00-byte-me-hub.png)

## 1.12 个按钮，覆盖六层 HotSpot 内部机制

把 JVM 想象成「源码 → 字节码 → 内部优化 → 汇编 → 运行参数 → 演进路线」一条流水线，每个工具卡在不同的层，彼此互补。先把全部真实地址列出来（直接抓自 byte-me.dev 顶部导航，不是凭记忆写的）：

| 按钮 | 真实地址 | 覆盖层 |
|---|---|---|
| Byte-Me | https://byte-me.dev/ | 字节码 |
| FullJEP | https://chriswhocodes.com/fulljep.html | JEP 详情 |
| JEPMap | https://chriswhocodes.com/jepmap.html | JEP 路线图 |
| JEPSearch | https://chriswhocodes.com/jepsearch.html | JEP 检索 |
| hsdis | https://chriswhocodes.com/hsdis/ | 反汇编 |
| JITWatch | https://github.com/AdoptOpenJDK/jitwatch | JIT 日志 |
| JaCoLine | https://jacoline.dev/inspect | 参数校验 |
| VM Options Explorer | https://chriswhocodes.com/vm-options-explorer.html | JVM 参数 |
| VM Intrinsics Explorer | https://chriswhocodes.com/vm-intrinsics-explorer.html | 内建函数 |
| GC Explorer | https://chriswhocodes.com/gc-explorer.html | 垃圾回收 |
| Optimizing Java | https://www.chrisnewland.com/optimizing-java | 方法论 |
| Thank You! | https://github.com/sponsors/chriswhocodes | 致谢 |

几个容易记错的修正：JaCoLine 现在独立成了 jacoline.dev（不再是 chriswhocodes.com 下的子页）；JITWatch 按钮直接跳 GitHub 仓库，因为它是桌面 GUI 工具，没有专门的展示页；Optimizing Java 跳到作者个人站，但路径已迁移，书本身在 O'Reilly。

按「你会在哪一层卡住」重新归类，整张地图是这样：

![工具矩阵六层视角](/images/series/jvm-tools/01-matrix.svg)

| 层 | 你会问的问题 | 对应工具 |
|---|---|---|
| 字节码 | 我的 Java 编译成什么样？ | Byte-Me（六） |
| JIT 内部优化 | 哪些方法被悄悄换掉？ | VM Intrinsics Explorer（八） |
| 汇编 | JIT 到底生成什么机器码？ | hsdis + JITWatch（三、四） |
| GC | 该选哪个垃圾回收器？ | GC Explorer（九） |
| JVM 参数 | 这些 `-XX` 是做什么的、有没有效？ | VM Options Explorer + JaCoLine（二、五） |
| 演进路线 | Java 接下来加什么？ | JEPMap / JEPSearch / FullJEP（七） |

最后用一本书把这整套方法论收口——《Optimizing Java》（十）。

## 2. 按问题选入口

最高效的用法：把当前遇到的问题对应到上面那张表，按层选工具。

| 你遇到的问题 | 直接去 |
|---|---|
| 这个 `-XX` 参数是做什么的、默认值多少？ | VM Options Explorer |
| 启动参数里有没有拼错的、已废弃的？ | JaCoLine |
| 升级 JDK 后哪些参数失效了？ | VM Options Explorer 的 differences 页 |
| 我的代码 JIT 后变成什么汇编？ | hsdis 装好 + JITWatch 可视化 |
| 这段代码为什么没被内联？ | JITWatch 的 Suggestion 面板 |
| 为什么 `Arrays.equals` / `Math.sin` 能这么快？ | VM Intrinsics Explorer |
| G1 和 ZGC 怎么选？我这个 JDK 有 ZGC 吗？ | GC Explorer |
| Java 21 加了什么？虚拟线程落地了吗？ | JEPMap |
| 想系统学 JVM 调优方法论 | Optimizing Java + 上面所有工具 |

## 3. 阅读路径与各篇关联

下面 9 篇按你理解 JVM 的认知顺序排列。每篇都会回到这张地图，告诉你这一层在整条链路里的位置，以及和前后两篇怎么串：

| 序号 | 文章 | 层 |
|---|---|---|
| （二） | VM Options Explorer | 参数 |
| （三） | hsdis | 汇编 |
| （四） | JITWatch | JIT 日志 |
| （五） | JaCoLine | 参数校验 |
| （六） | Byte-Me | 字节码 |
| （七） | JEP 三件套 | 路线图 |
| （八） | VM Intrinsics Explorer | 内建函数 |
| （九） | GC Explorer | GC |
| （十） | Optimizing Java | 方法论 |

## 4. 注意事项

- 这些工具是「理解辅助」，不是官方文档；数据源是 OpenJDK 源码快照，关键决策仍以你所用 JDK 的官方 Release Notes 为准。
- hsdis 等二进制下载属第三方构建，使用前按页面提示自行做法律与安全评估。
- 作者一个人维护，工具强依赖个人精力——关键用法建议截图/存档，别只依赖在线访问。

## 5. 小结

看清地图，下一篇钻最常用、也最容易被低估的那个——VM Options Explorer（二），看怎么把上千个 HotSpot 参数变成一张能搜索、能对比的活地图。

## 参考链接

- byte-me.dev 总入口：https://byte-me.dev/
- 作者个人站：https://www.chrisnewland.com/
- Chris Newland GitHub：https://github.com/chriswhocodes
- JITWatch GitHub：https://github.com/AdoptOpenJDK/jitwatch
