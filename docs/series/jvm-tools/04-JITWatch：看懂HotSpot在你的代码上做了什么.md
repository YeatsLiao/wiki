# JVM工具解读 · JITWatch：看懂 HotSpot 在你的代码上做了什么

> 工具：JITWatch 桌面版（github.com/AdoptOpenJDK/jitwatch）
> 真实地址：https://github.com/AdoptOpenJDK/jitwatch
> 适用场景：可视化分析 HotSpot 编译日志，定位未内联方法与热点代码

HotSpot 会告诉你方法被编译了（`-XX:+PrintCompilation`），会吐 XML 日志（`-XX:+LogCompilation`），还能打印机器码（`-XX:+PrintAssembly`，见上篇）。但这些信息对真人极不友好——JIT 日志里塞着分支预测、逃逸分析、intrinsic、锁消除、代码缓存布局，非 trivial 程序根本读不动。

JITWatch 就是把这些日志翻译成人能看懂的图。注意：它是 JavaFX 桌面程序，不是网页工具，byte-me.dev 上的按钮直接跳 GitHub 仓库。

![JITWatch GitHub 仓库页](/images/series/jvm-tools/04-jitwatch.png)

![JITWatch GitHub 仓库页（按钮的真实目的地）](/images/series/jvm-tools/04-jitwatch.png)

## 1.问题背景：JIT 的三种输出，没一个好读

HotSpot 暴露 JIT 决策有三种方式：

| 方式 | 输出 | 痛点 |
|---|---|---|
| `PrintCompilation` | 「方法 X 在第 Y ms 被 C2 编译」级别的简略文本 | 信息太少，看不到决策细节 |
| `LogCompilation` | verbose 的 XML，包含分支预测、逃逸分析、intrinsics、代码缓存布局 | 格式极冗长，肉眼根本读不动 |
| `PrintAssembly` | 用反汇编插件输出 JIT 生成的真实机器码（见上篇 hsdis） | 量大、需要 hsdis 配合 |

Chris 在 2013 年啃完无数 `LogCompilation` 的 XML 后动手做了 JITWatch。它现在十多年了，每月 GitHub 克隆 1000+ 次，据说 Oracle 内部 JVM 团队都在用。

## 2. 设计理念：把日志变成图、表、时间线

JITWatch 解析 `LogCompilation` 和 `PrintAssembly` 日志，产出一套可视化视图：

![JITWatch 核心视图](/images/series/jvm-tools/04-jitwatch-views.svg)

### 2.1 TriView

左边源码、中间字节码、右边 JIT 生成的汇编，三栏并列。亮点是在字节码上**标注了内联来源和分支命中概率**——你能直接看到「这个方法被内联进去了」「这个 if 几乎总走 true 分支（profiled_biased 100%）」「这里是个 megamorphic call site，C2 没敢激进优化」。

### 2.2 编译链 Compile Chain

画出某个方法被谁调用、又被内联了哪些成员、逐层展开，调用关系一目了然。

### 2.3 建议工具：JITWatch 的精华

自动高亮**内联失败的热点方法**、**不可预测的分支**、**未命中的 intrinsic**、**被去优化的方法**，直接告诉你「这里可能拖慢了你」。它背后是若干启发式：

- 热点方法但内联失败（`InlineTooLarge` / `InlineRecursive` / `NeverInline`）
- profile 不稳定的分支（`BranchProfileNotTaken` / `taken=0.5` 类）
- 代码缓存占用过高（接近 `ReservedCodeCacheSize`）
- deoptimization 事件聚集

### 2.4 时间线与直方图

编译次数随时间变化、代码缓存空闲空间随时间变化、最大原生方法 Top 榜、编译耗时直方图——性能回落时这些图能快速定位是不是「代码缓存被打满导致退回解释执行」（`CodeCache full` 是个常见但很多人没意识到的陷阱）。

### 2.5 JIT Sandbox

JITWatch 自带一个沙盒：写一小段 Java 代码 → 用当前 JVM 编译 → 执行 → 分析。适合做「这段写法 JIT 会不会优化」的微观实验，不需要把整个应用跑起来。

## 3. LogCompilation XML 解读

上面反复提到的 `LogCompilation`，是 HotSpot 的一个开关，能把 JIT 干的每一件事（编译、内联、去优化……）记成一份 XML 日志——JITWatch 读的就是这份日志，所以理解它记录的节点，是看懂 JITWatch 的前提。

理解 JITWatch 怎么解析的，关键看懂一份 `LogCompilation` XML 里几个核心节点：

```xml
<compilation_log version="1.0" epoch="..." process_id="...">
  <vm_version name="..." release="..." />
  <compilation id="123" compile_id="456" method="Foo.hotMethod" ...>
    <task compile_kind="c2" ...
          bytes_required="8000" bytes_used="7800" .../>
    <phase name="parse" stamp="1.234" />
    <phase name="optimize" stamp="1.250" />
    <phase name="matcher" stamp="1.280" />
    <phase name="regalloc" stamp="1.300" />
    <phase name="peephole" stamp="1.310" />
    <phase name="codeemit" stamp="1.320" />
    <inline_success reason="always" .../>
    <!-- 或 -->
    <inline_fail reason="hot path too deep" .../>
    <call method="Bar.helper" count="50000" prof_factor="1.0"/>
    <branches>
      <branch taken="9000" not_taken="1000" prob="0.9" .../>
    </branches>
    <intrinsic id="_dsin"/>
    <parse_done stamp="1.245"/>
    <compile_done stamp="1.325"/>
  </compilation>
</compilation_log>
```

JITWatch 把 `<phase>` 折叠成时间线、把 `<inline_success>` / `<inline_fail>` 画到 TriView 的字节码上、把 `<call>` 的 count + prof_factor 转成热点判定输入、把 `<intrinsic>` 高亮成调用站点上的「⚡」标记。

## 4. 怎么用：真实操作流程

### 4.1 跑出 JIT 日志

```bash
java \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:+TraceClassLoading \
  -XX:+LogCompilation -XX:LogFile=jit.log \
  -XX:+PrintAssembly -XX:PrintAssemblyOptions=intel \
  -jar yourapp.jar
```

跑完你的典型负载（最好覆盖一次完整业务循环）后停掉，`jit.log` 就是 JITWatch 的输入。

### 4.2 安装与运行 JITWatch

JITWatch 是 Java + JavaFX 桌面程序，跨平台：

```bash
git clone https://github.com/AdoptOpenJDK/jitwatch.git
cd jitwatch
mvn clean package
```

跑 UI：

```bash
# JVM工具解读 · 方式一：用启动脚本（Linux/macOS）
./launchUI.sh

# JVM工具解读 · 方式二：直接跑 jar
java -jar target/jitwatch-ui-*.jar
```

需要 JDK 11+（含 JavaFX），Windows 上双击 `launchUI.bat`。

### 4.3 在 JITWatch 里分析

1. **配置源码 + class 路径**：菜单 `Config → Sandbox` 或 `Config → Runtime`，把你的项目源码目录、`target/classes` 路径配进去——TriView 的左栏源码高亮靠这个。
2. **打开日志**：`File → Open Log → jit.log`。
3. **点 Start**：JITWatch 开始解析 XML，建模型。
4. **选方法看 TriView**：左侧包树挑一个怀疑慢的方法，双击 → 看三栏，确认内联情况。
5. **看 Suggestion 面板**：优先处理被标红的热点。
6. **看 Code Cache 时间线**：确认没被打满。如果打满，看右上角的代码缓存空闲曲线——是不是长时间贴近 0。

### 4.4 用 JIT Sandbox 做微观实验

`Sandbox` 标签 → 在编辑器里写一段代码（比如 `Math.sin` 密集调用、`StringBuilder` 拼接、`List.sort`）→ 点 Compile → 看字节码 + 汇编 → 改代码再 compile → 对比不同写法 JIT 出的差异。非常适合「这个写法 JIT 会优化吗」的快速验证。

## 5. 实际应用示例

### 5.1 排查「代码缓存满导致回退解释执行」

现象：应用跑了一段时间后某些方法突然变慢，日志里出现 `compilation: disabled (code cache full)`。

操作：JITWatch 的 Code Cache 时间线 → 看空闲空间曲线在某个时间点归零 → 把 `ReservedCodeCacheSize` 调大（注意：占用的是 native 内存）。

### 5.2 验证 `final` 修饰对内联的影响

`final` 在现代 JIT 里通常不再关键（profile 主导），但仍是减少 megamorphic 的好习惯。JITWatch 里同一方法，有无 `final` 对比 TriView 字节码上的内联箭头，能直观看到差异。

### 5.3 验证 intrinsic 替换

期望 `Math.sin` 被替换成 `fsin` 指令。在 JITWatch 里搜 `Math.sin` 的调用站点，看汇编上是否出现 `fsin` 或 AVX 版本的向量指令。

## 6. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| hsdis（三） | **必需搭档**。JITWatch 的 TriView 右栏汇编由 hsdis 提供；不装 hsdis，右栏是空的。 |
| VM Options Explorer（二） | JIT 日志涉及大量 diagnostic 参数（`PrintAssembly`、`LogCompilation`、`CompileCommand`、`UnlockDiagnosticVMOptions`），在 Explorer 里能查每个参数的含义。 |
| VM Intrinsics Explorer（八） | 日志里 `<intrinsic>` 节点的 ID 来自 `vmIntrinsics.hpp`，Intrinsics Explorer 给你完整清单对照。 |
| VM Options Explorer 的 differences 页 | 升级 JDK 前，要重新跑一次 `LogCompilation`——某些参数改了，日志格式也会微调，JITWatch 的解析版本要匹配。 |

## 7. 注意事项

- 装 hsdis 才能看汇编（右栏），否则 TriView 残缺。
- 是 JavaFX 桌面程序，需要本机图形环境；CI 里做自动化分析不如直接解析 `LogCompilation` XML（可用社区库 `jitwatch-parser` 或自写解析）。
- 日志量大时载入慢，分析前用 `-XX:CompileCommand=print` / `exclude` 缩小范围。
- JITWatch 是个人项目，对最新 JDK 的 `LogCompilation` XML 格式跟进可能有延迟，遇到解析报错时升级到最新 release 或提 issue。

## 8. 小结

JITWatch 让你看见 JIT 的决策。但还有一个更隐蔽的「内部机制」——你写的某些方法，HotSpot 压根没走你写的字节码，而是自动替换为了手写汇编。下一篇 VM Intrinsics Explorer（八）就专门揭这个谜。

## 参考链接

- JITWatch GitHub：https://github.com/AdoptOpenJDK/jitwatch
- JITWatch Wiki / 用户指南：https://github.com/AdoptOpenJDK/jitwatch/wiki
- JITWatch 介绍视频（Chris 本人在 JCrete 的演讲）：https://github.com/AdoptOpenJDK/jitwatch/wiki/Videos
- OpenJDK HotSpot Internals / LogCompilation 格式：https://wiki.openjdk.org/display/HotSpot/LogCompilation