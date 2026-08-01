# GC Explorer：把垃圾回收器摊开给你看

> 工具：GC Explorer（chriswhocodes.com/gc-explorer.html）
> 适用场景：对比各 JDK 版本与发行版的垃圾回收器可用性，为 GC 选型提供依据

> 真实地址：https://chriswhocodes.com/gc-explorer.html
> 适用场景：升级 JDK 或选发行版前，确认目标 GC 是否可用、各版本差异

## 0. “我这个 JDK 能用 ZGC 吗”

「我这个 JDK 版本能用 ZGC 吗？」「从 JDK 8 升到 17，CMS 是不是没了？」「Corretto 和 Zulu 在 GC 支持上一样吗？」这些问题的答案散落在各发行版文档里，记不住也搜不全。GC 是 JVM 自动回收不用的内存、不用你手动释放的机制；而 G1、ZGC、Shenandoah、CMS、Parallel、Serial、Epsilon 是几种不同的垃圾回收器，各有取舍——有的吞吐高、有的延迟低、有的干脆只分配不回收。GC Explorer 直接把它们的可用性做成一张矩阵：行是 JDK 版本 / 发行版，列是各种 GC，单元格是「支持 / 不支持」。**一眼就能判断该用哪个、不能用哪个**。

打开真实页面 https://chriswhocodes.com/gc-explorer.html：

![GC Explorer：Corretto 与 Dragonwell 的 GC 可用性矩阵](/images/series/jvm-tools/09-gc-explorer.png)

页面就是一张「发行版 × JDK 版本 × GC」的巨型矩阵，每个发行版一个表格块。Corretto 块里能看到从 JDK 8 到 JDK 26 的 GC 列覆盖情况；Dragonwell 块紧随其后。

## 1. 问题背景：GC 可用性随版本和发行版漂移

垃圾回收器是 JVM 调优里最关键的旋钮之一，但它的可用性一直在变：

- **CMS 被移除**：JDK 9 标记废弃，JDK 14 正式移除。老脚本里 `-XX:+UseConcMarkSweepGC` 在新 JDK 直接报错。
- **默认 GC 变了**：JDK 9 起默认从 Parallel 改成 G1；ZGC / Shenandoah 在不同版本陆续从 experimental 转正。
- **发行版差异**：同样的 OpenJDK，Dragonwell、Corretto、GraalVM 对 GC 的支持窗口略有不同（某些国产/云厂商 JDK 会早一点或晚一点带某个 GC）。

靠记忆或翻多篇文档，极易踩坑。

## 2. 矩阵的列：七大主流 GC

![GC 可用性矩阵示意：行是 JDK / 发行版，列是各 GC，CMS 自 JDK 14 起整列消失](/images/series/jvm-tools/09-gc-matrix.svg)

截图里能看到这些列：

| 列 | GC | 定位 | 关键 JEP / 时间点 |
|---|---|---|---|
| C4 | Continuously Concurrent Compacting Collector | Azul 风格的并发压缩 | 某些厂商实验性引入 |
| CMS | Concurrent Mark Sweep | 老牌低延迟 | JDK 9 deprecated，JDK 14 **removed** |
| EPSILON | Epsilon | 无操作 GC（只分配不回收） | JEP 318（JDK 11） |
| G1 | Garbage-First | JDK 9 起默认 | JEP 248 |
| PARALLEL | Parallel GC | 吞吐量优先 | 多年的默认 |
| SERIAL | Serial GC | 单线程，适合小堆/客户端 | — |
| SHENANDOAH | Shenandoah | Red Hat 的低延迟并发 GC | JEP 189（JDK 12 experimental）→ 后续转正 |
| Z | ZGC | 超低延迟可扩展 GC | JEP 333（JDK 11 experimental）→ JEP 377（JDK 15 production） |

## 3. 怎么用：真实操作流程

### 3.1 升级 JDK 前核对

场景：计划从 JDK 8 升 17。

1. 打开 GC Explorer。
2. 找到 OpenJDK 块，对比 8 和 17 两行：
   - **CMS**：JDK 8 是 `Y`，JDK 17 整列消失（因为 JDK 14 移除）
   - **Z**：JDK 8 没有，JDK 11 起 experimental，JDK 15+ production
   - **G1**：JDK 8 已有，JDK 17 持续
3. 在 VM Options Explorer（二）的 differences 页交叉验证参数变化。
4. 把脚本里的 `-XX:+UseConcMarkSweepGC` 换成 G1 或 ZGC（`+UseZGC`）。

### 3.2 选发行版

场景：团队在 Corretto 和 Dragonwell 之间二选一。

1. GC Explorer 找到 Corretto 和 Dragonwell 块。
2. 对比同一 JDK 版本（比如 17）两行：通常 G1 / Parallel / Serial / ZGC 都 `Y`；差异可能在 Shenandoah（某些国产 JDK 默认带，某些不带）。
3. 结合业务场景（延迟敏感 / 吞吐优先 / 大小堆）决定。

### 3.3 验证目标环境真有 ZGC

实际排查案例：脚本写了 `-XX:+UseZGC`，但启动报错 `ZGC is not supported`。

操作：GC Explorer 查目标发行版 + JDK 版本，Z 列必须是 `Y`。如果是空白——是该 GC 在此环境不可用（可能是不支持的 CPU 架构、或某个 minimal build 不带）。

### 3.4 注意「支持 ≠ 默认」

矩阵显示的是「**是否可用**」，不代表「**默认使用**」。JDK 9+ 默认 G1；某些发行版在大堆场景倾向 ZGC。具体默认行为以目标 JDK 的 Release Notes 为准——Explorer 管「能开」，默认另查。

## 4. 实际应用示例

### 4.1 「为什么我加 `+UseZGC` 还是没生效」

GC Explorer 显示你那个 JDK 版本 Z 列是 `Y`，但启动没报错也没生效。看启动日志——很可能目标 CPU 不支持（ZGC 需要地址映射相关的内核能力，容器里有时缺）。这时考虑：

- 升级基础镜像（内核版本）
- 或换 Shenandoah
- 或回退 G1

### 4.2 选 GC 的决策树

结合矩阵 + 业务特征：

```
小堆（< ~1GB） → Serial 或 Parallel
中等堆、追求吞吐 → G1 或 Parallel
大堆、低延迟目标 → ZGC（JDK 15+）
大堆、超低延迟、且能接受更多 CPU 开销 → Shenandoah
只想分配不回收（短命进程/测试） → Epsilon
```

矩阵只解决「能不能用」，决策还要结合业务。

## 5. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| VM Options Explorer（二） | 互补。GC Explorer 答「这个 JDK 有哪些 GC」，VM Options Explorer 答「这些 GC 的具体调优参数（`-XX:+UseG1GC`、`-XX:MaxGCPauseMillis`、`-XX:InitiatingHeapOccupancyPercent` 等）是什么」。 |
| JaCoLine（五） | GC Explorer 看出 GC 可用性，JaCoLine 验启动参数——升级时如果还残留 `-XX:+UseConcMarkSweepGC`，JaCoLine 直接报 Obsolete。 |
| hotspot_option_differences.html | 跨版本升级时，differences 页列哪些 GC 参数被废弃 / 移除，配合 GC Explorer 的矩阵一起看。 |
| JEP 三件套（七） | GC 变化通常由 JEP 驱动（JEP 377 ZGC Production → GC Explorer Z 列从空白变 Y；JEP 318 Epsilon → 新增 EPSILON 列）。 |
| JITWatch（四） | JITWatch 看 JIT 决策；GC 日志（`-Xlog:gc*`）配合 JITWatch 的 Code Cache 时间线，能综合判断「GC + JIT」的整体压力。 |
| Byte-Me（六） | 弱关联。GC 在 JVM 运行期工作，Byte-Me 只到字节码——但如果你想理解 GC 为什么要在 class 文件里塞那么多引用标记信息，Byte-Me 是入口。 |

## 6. 注意事项

- 矩阵是数据源快照，大版本间可能微调，关键上线前以目标 JDK 官方文档核实。
- `Y` 只代表该构建包含此 GC，**不代表在该环境下性能合适**（ZGC 低延迟但吃内存，Serial 适合小堆）。
- 某些 cell 的「支持」可能指特定构建（如 GraalVM native-image 的 GC 选项和 HotSpot 不同），读表时看行头注明。
- GC 选型是综合决策（延迟目标、堆大小、CPU 开销、容器环境），Explorer 只解决「能不能用」的第一步。

## 7. 小结

GC Explorer 解决「该用哪个 GC、能不能用」。到这儿，我们已经把字节码、JIT、参数、intrinsics、GC、路线图都过了一遍——这些工具单个有用，合起来是一套认知体系。最后一篇，用一本书把这整套方法论收个尾。

## 参考链接

- GC Explorer：https://chriswhocodes.com/gc-explorer.html
- OpenJDK ZGC 项目页：https://openjdk.org/projects/zgc/
- OpenJDK Shenandoah 项目页：https://wiki.openjdk.org/display/shenandoah/Main
- HotSpot 垃圾回收指南：https://docs.oracle.com/en/java/javase/21/gctuning/
- JEP 377（ZGC Production）：https://openjdk.org/jeps/377