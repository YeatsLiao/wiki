# JVM工具解读 · VM Options Explorer：把 HotSpot 参数内部机制拆开

> 工具：VM Options Explorer（chriswhocodes.com/vm-options-explorer.html）
> 适用场景：查任意 -XX 参数的含义与默认值，对比跨 JDK 版本、跨发行版的参数差异

> 真实地址：https://chriswhocodes.com/vm-options-explorer.html
> 配套页（版本/发行版差异）：https://chriswhocodes.com/hotspot_option_differences.html
> 适用场景：查某个 `-XX` 参数的含义/默认值/可用性，或升级 JDK / 换发行版时核对参数差异

接手一个老服务，启动脚本里有一串 JVM 调优开关，比如 `-XX:+AggressiveOpts`、`-XX:MaxPermSize=256m`、`-XX:+UseConcMarkSweepGC`。这些 `-XX` 开头的参数，是 Java 程序运行时那台「虚拟计算机」（行话叫 JVM，HotSpot 是它最主流的一种实现）留给我们的一堆内部旋钮——它们控制着垃圾回收怎么跑、JIT 怎么编译、内存怎么分。你隐约记得 AggressiveOpts 这玩意「过时了」，但不确定从哪个版本开始；MaxPermSize 好像在新版上压根不认。搜索引擎告诉你一堆互相矛盾的说法。

这时候你需要的不是一篇博客，而是一张能直接告诉你「这个参数：从 JDK 6 引入、JDK 11 废弃、JDK 12 移除、类型是 bool、默认 false、定义在 `share/runtime/globals.hpp`」的权威表格。VM Options Explorer 就是这张表——每个字段都来自 OpenJDK 源码自动解析，不是手填的。

![VM Options Explorer 主页面](/images/series/jvm-tools/02-vm-options.png)

## 1.问题背景：参数藏在源码深处，文档基本为零

HotSpot 的上千个 `-XX` 参数定义散落在这些文件里：

- `share/runtime/globals.hpp`（runtime / 通用）
- `share/gc/shared/gc_globals.hpp`（GC 通用）
- `share/gc/g1/g1_globals.hpp`、`share/gc/z/z_globals.hpp`（各 GC）
- `share/opto/c2_globals.hpp`、`share/c1/c1_globals.hpp`（两个 JIT 编译器）
- `share/opto/subnode.hpp` 等（部分内联参数）

形如：

```cpp
product(bool, AggressiveOpts, false,
        "(Deprecated) Enable aggressive optimizations")
```

想查一个参数，过去你得会读 C++ 宏、知道它在哪个文件、还得自己对照不同 JDK 版本的源码差异。更麻烦的是**版本漂移**：一个参数在 JDK 8 是 `product`，JDK 17 可能变 `obsolete`，JDK 21 直接 `expired`——用错版本就是启动报错或参数被静默忽略。

## 2. 设计理念：把 globals.hpp 解析成可筛选的活表格

Explorer 干的事很直接：解析这些 `globals.hpp` 头文件里的宏定义，把每个参数抽成一行结构化记录。

### 2.1 每条记录包含的字段

直接从页面表格里能看到：

| 字段 | 含义 | 来源 |
|---|---|---|
| Name | 参数名（如 `MaxGCPauseMillis`） | 宏第二个字段 |
| Since | 从哪个 JDK 版本引入 | 解析源码历史 |
| Deprecated | 废弃/淘汰/过期状态 + 版本 | 注释里的 `(Deprecated)` 等 |
| Type | 数据类型（bool/intx/uintx/ccstr/ccstrlist/size_t/double/int/uint64_t） | 宏第一个字段 |
| OS | 适用 OS（linux/windows/aix/bsd/solaris） | `define_pd_global` 等平台宏 |
| CPU | 适用架构（x86/aarch64/arm/ppc/s390/sparc/zero） | 同上 |
| Component | 归属模块（gc/runtime/c1/c2/jvmci） | 头文件归属 |
| Default | 默认值 | 宏第三个字段 |
| Availability | 可用性等级（product/manageable/diagnostic/experimental/develop/notproduct） | 宏第四个字段的类型 |
| Description | 说明文字 | 宏末尾字符串 |
| Defined in | 源码位置 | 文件路径 |

### 2.2 可用性等级的真实含义

表格里有一栏叫「Availability」，它其实是 HotSpot 给每个参数贴的「使用权限标签」：有的谁都能直接用，有的得先输一道「口令」（一个解锁开关）才放行，有的只在调试版 JVM 里存在、你线上那个正式版压根没有。这一栏直接决定了「你能不能用、怎么用」，HotSpot 在 `Arguments::parse_each_vm_flags_file_arg` 里就会检查它：

| 等级 | 源码里的样子 | 实际能否直接用 |
|---|---|---|
| `product` | `product(bool, Foo, ...)` | 默认开放，直接传 |
| `manageable` | `manageable(bool, Foo, ...)` | 默认开放，且**运行时**可通过 JMX / `jcmd VM.set_flag` 改 |
| `diagnostic` | `diagnostic(bool, Foo, ...)` | **必须**先 `-XX:+UnlockDiagnosticVMOptions` 解锁，否则 JVM 直接忽略 |
| `experimental` | `experimental(bool, Foo, ...)` | 必须 `-XX:+UnlockExperimentalVMOptions` |
| `develop` | `develop(bool, Foo, ...)` | 只在 debug 构建里有，release 版根本没有这个参数 |
| `notproduct` | `notproduct(bool, Foo, ...)` | 同上，release 不可用 |

很多「为什么我加了参数没效果」的坑，根源就是忽略了等级——`diagnostic` 参数不加解锁开关，JVM 默默吞掉。

### 2.3 数据从哪来

VM Options Explorer 的数据是**自动从 OpenJDK 源码解析**的（不是作者手填，所以不会和官方打架）。每个厂商（Corretto、Zulu、Dragonwell、GraalVM、Liberica、Temurin、Microsoft、Oracle、SapMachine、OpenJ9）各有一份独立的子页面（`corretto_*_options.html` 这种命名），用同一套解析器跑各家源码快照生成——所以你能直接对比 OpenJDK 11 和 Corretto 11 多了哪些私有参数。

## 3. 怎么用：真实操作流程

打开主页面 https://chriswhocodes.com/vm-options-explorer.html 之后，顶部那一排是**七个可叠加的筛选器**（不是按钮，是带搜索的下拉）：

![七个筛选维度](/images/series/jvm-tools/02-param-filter.svg)

### 3.1 查一个陌生参数

1. 在 Name 列上方的搜索框输入关键字，比如 `MaxGCPauseMillis`、`UseCompressedOops`、`G1HeapRegionSize`。
2. 表格实时过滤，剩下的行就是这个参数在当前所选 JDK 版本下的完整定义。
3. 想确认「这个参数是不是我当前 JDK 还支持」：切顶部版本下拉（默认 OpenJDK 11，可选 6~11，更高版本是独立子页）。
4. 想看源码：抄「Defined in」列的路径，到 https://github.com/openjdk/jdk 搜对应文件路径，定位具体行。

### 3.2 跨版本差异

页面上方有一条链接 **"Options added/removed between JDKs"**，点进去到 https://chriswhocodes.com/hotspot_option_differences.html：

![HotSpot 参数跨版本差异页](/images/series/jvm-tools/02b-vm-options-diff.png)

这张页面做的事：

- 按版本列出**新增（Added）/ 移除（Removed）/ 废弃（Deprecated）/ 过期（Expired）**的参数
- 提供「放大镜」对比：选两个发行版（或两个版本），单独拉出它们的差异（这就是「换发行版行为变了」的根因工具）

实战工作流（升级前 5 分钟完成）：

1. 在 differences 页选「OpenJDK 11 → OpenJDK 17」。
2. 重点扫 Removed 和 Deprecated 两栏。
3. 把你们启动脚本里的 `-XX:+XXX` 一一在 Explorer 主表里搜，按 availability 判断能不能继续用。
4. 把 Removed 的直接从脚本里删掉（留着会让新 JVM 报「Unrecognized VM option」）。

### 3.3 跨发行版差异

同样的 `-XX:+UseG1GC`，在 OpenJDK、Corretto、Dragonwell 默认值可能不同。直接在 Explorer 主表里把顶部版本下拉切换到 `corretto_*_options.html` 那种独立页对比即可。

### 3.4 定位源码做定制

每条记录都有「Defined in」字段，比如 `share/gc/g1/g1_globals.hpp`。这等于告诉你「想改 G1 的某个行为，去这个文件里找这个宏」——深入定制 HotSpot 的起点。

## 4. 实际应用示例

### 4.1 排查「遗留参数失效」

场景：你的脚本里有 `-XX:+AggressiveOpts` `-XX:MaxPermSize=256m` `-XX:+UseConcMarkSweepGC`。JDK 17 上跑：

1. Explorer 搜 `AggressiveOpts` → Since: 6, Deprecated: 11, Default false, Availability product。
2. 搜 `MaxPermSize` → 这个参数守着老版 JVM 的一块内存区「永久代」（专门存类的元信息），JDK 8 把它整个移除、换成「元空间」，所以这句在 JDK 17 上会直接报 `Unrecognized VM option`。
3. 搜 `UseConcMarkSweepGC` → CMS（一种老牌垃圾回收器）在 JDK 14 移除。

结论：三个参数都要从脚本里拿掉。differences 页里 Removed 列一眼扫完。

### 4.2 找到能让运行时改的参数

如果想用 `jcmd <pid> VM.set_flag` 在不重启进程的前提下调某个值（比如某些 GC 参数），在 Explorer 里把 Availability 筛选成 `manageable`，立刻得到所有可热改的清单。

## 5. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| JaCoLine（五） | **同源数据，反向用法**。Explorer 是「查单个参数的含义」（正向），JaCoLine 是「把整条命令行喂进去做体检」（反向校验拼写/废弃/冲突）。先来 Explorer 查清楚，再上 JaCoLine 跑全量。 |
| hotspot_option_differences.html | 同一站点的**姊妹页**，专门做版本/发行版差异。本篇主表适合查静态信息，差异页适合升级/换发行版的迁移场景。 |
| GC Explorer（九） | 互补。GC Explorer 答「这个 JDK 有哪些 GC 可选」，Explorer 答「这些 GC 对应的具体调优参数（`-XX:+UseG1GC`、`-XX:MaxGCPauseMillis`）是什么」。 |
| Byte-Me（六） | 互补视角。Byte-Me 看 Java → 字节码，Explorer 看字节码运行时的容器（参数 + 平台）。 |
| VM Intrinsics Explorer（八） | 都基于 OpenJDK 头文件解析（`globals.hpp` vs `vmIntrinsics.hpp`），同样的设计哲学。 |

## 6. 注意事项

- 数据源是 OpenJDK 源码快照，大版本间可能滞后于最新小版本；关键上线决策以你所用 JDK 的官方 Release Notes 为准。
- 「厂商对比」功能依赖作者手动维护各发行版快照，小版本可能有遗漏。
- `product` 不等于「推荐用」——很多 `product` 参数有副作用，改之前看懂 Description 列再说。
- `manageable` 不代表所有平台都能热改，具体看 HotSpot 实现。

## 7. 小结

VM Options Explorer 解决的是「参数看不见」。但 JVM 还有另一半内部机制——**代码被 JIT 编译成了什么**。下一篇 hsdis（三），就是打开这半扇门的钥匙。

## 参考链接

- VM Options Explorer：https://chriswhocodes.com/vm-options-explorer.html
- HotSpot 参数跨版本差异：https://chriswhocodes.com/hotspot_option_differences.html
- OpenJDK globals.hpp（参数定义源头）：https://github.com/openjdk/jdk/blob/master/src/hotspot/share/runtime/globals.hpp
- 解析脚本与数据生成方式：https://github.com/chriswhocodes/vm-options-explorer
- JaCoLine（同源数据反向工具，五）：https://jacoline.dev/inspect