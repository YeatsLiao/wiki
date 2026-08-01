# JIT预热与AOT编译的兴衰

> 技术栈：HotSpot JIT（C1/C2）+ JEP 295 AOT + GraalVM Native Image + Dragonwell
> 适用场景：解释执行成为启动性能瓶颈，想了解 JIT 预热机制、AOT 的历史轨迹，以及 Dragonwell 如何将 AOT 缝合进现有优化链路

## 0. 类加载之后，JIT 预热这道坎

前面三篇，我们分别拆了类加载的查找、解析、初始化三个环节，用 AppCDS 省了解析，用 JAR Index 省了查找，用 Heap Archive 省了初始化。至此，类加载这条链路理论上已经打通：一个类从磁盘到可用，大部分步骤都能跳过或加速。

但真正开始执行业务逻辑时，还有一个大问题悬而未决：所有方法——包括那些在启动阶段被频繁调用上千次的热点方法——都是以解释方式跑的。HotSpot 的确有业界顶级的 JIT 编译器 C2，但它启动得太慢了。

Java 在解释执行和 JIT 编译后的性能差距，大约在 26 到 50 倍。也就是说，启动阶段你的程序其实是以慢动作在跑——框架初始化、配置解析、IoC 容器构建，每一步背后都是解释执行在拖慢整体性能。

为了填平这道鸿沟，开发者们尝试过两条路：一条是加速 JIT（让预热来得更早），一条是绕过 JIT（在启动前就把代码编译好）。后一条路就是 AOT，它在 JDK 9 中以实验特性出现，在 JDK 16 中被删除——技术本身不差，但受限于维护成本和工程兼容性而未能存活。这篇就来还原 AOT 这段跌宕起伏的轨迹，以及 Dragonwell 是如何在此基础上继续推进的。

## 1. 问题背景：解释执行到底有多慢

### 1.1 先说一个数据

用 JMH 对比解释执行和 C2 编译后的性能差距，以 hessianIO 序列化 benchmark 为例：

```java
@State(Scope.Thread)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
public class SerializeBenchmark {

    @Benchmark
    public byte[] hessianSerialize(Blackhole bh) {
        return serializer.serialize(data);
    }
}
```

两轮测试的数据：

| 场景 | 吞吐 (ops/s) | 比例 |
|:---|:---|:---|
| Fork 0 (解释执行) | 4,535 | 1x |
| Fork 1 (C2 编译后) | 118,194 | 26x |

26 倍的差距。这不是理论估算，是 JMH 跑出来的实测数据。值得留意的是，118,194 这个稳态值代表 C2 充分优化后的性能，它已经非常接近 C 语言同等逻辑的水平——Java 的 JIT 编译器在设计上完全不逊色于其他语言。但 4,535 这个值，才是一个刚启动的 Java 应用的真实状态。

### 1.2 switch-case 解释循环的本质

解释执行慢在哪儿？从字节码解释器的实现可以看得很清楚。HotSpot 的解释器本质上是一个巨大的 switch-case 循环，每个字节码指令对应一个 case 分支：

```cpp
// HotSpot template interpreter 的简化示意
while (true) {
    int opcode = *pc++;  // 取当前字节码
    switch (opcode) {
        case opc::getfield:
            // 解析常量池引用、计算字段偏移、从对象读取字段
            break;
        case opc::invokevirtual:
            // 解析符号引用、查虚方法表、间接调用
            break;
        case opc::iadd:
            // 栈顶两个整数相加
            break;
        // ... 另外 200+ 个 case
    }
}
```

每一个字节码指令都要走一遍 switch-case 分发、取操作数、执行、写结果。业务代码执行一遍，解释器内部的 switch-case 可能走了数百遍。而 C2 编译后的代码是直接翻译成机器指令的，没有中间层，没有分发开销，还可以做内联、逃逸分析、循环展开等激进优化。

这就是 26 到 50 倍差距的根源：解释器的每条 Java 指令，在 CPU 看来都是一长串间接跳转和不相关的操作，而 JIT 代码是直接跑在 CPU 上的一连串高效指令。

## 2. 设计理念：JIT 预热与 AOT 的理想

### 2.1 JIT 为什么预热慢

HotSpot 的分层编译决定了方法从解释执行到 C2 优化要过三道坎：

- **Tier 0**（解释器）：所有方法出生就在这层
- **Tier 3**（C1 编译）：方法调用 + 回边计数合计约 2000 次后触发
- **Tier 4**（C2 编译）：方法调用约 15000 次后触发

2000 次调用是什么概念？对一个复杂 Spring Boot 应用来说，很多方法在整个启动过程中只会被调用几十到几百次——它们永远达不到 C1 的门槛，更不用说 C2。即便是那些达到门槛的方法，C2 编译本身也需要额外的 CPU 时间和内存（C2 的编译线程本身就是计算密集型的）。

这意味着启动阶段的两个事实：（1）大部分方法停留在解释执行，（2）少数热点方法的 C2 编译过程本身还在和业务逻辑抢 CPU。两者叠加，启动阶段的实际性能远低于稳态，这就是预热问题。

![HotSpot分层编译与JIT预热门槛](/images/series/java-startup-optimization/04-tiered-compilation.svg)

### 2.2 AOT 的理想：把编译提前到构建期

AOT（Ahead-of-Time Compilation）的思路正好反过来：既然预热是问题，那就干脆绕过 JIT，在应用部署之前就把字节码编译成 native 代码。JDK 9 中引入的 JEP 295（实验性 AOT 编译）就是这条路。

它的工具叫 `jaotc`，用起来很直观：

```bash
# 将某个 jar/module 的字节码预编译为 .so 库
jaotc --output libapp.so --module name.module

# 启动时加载 AOT 库
java -XX:AOTLibrary=./libapp.so -jar your-app.jar
```

JVM 启动时通过 `-XX:AOTLibrary` 加载预生成的 .so 文件。类加载完成后，JVM 会自动检查这个类有没有对应的 AOT 编译入口，如果有，就直接使用 AOT 代码替代解释执行。理想情况下，应用从启动伊始就以接近 C2 的性能运行，无需等待 JIT 预热。

这个设计在逻辑上无懈可击，但工程上遇到了三个让 AOT 最终被放弃的致命问题。

## 3. 实际应用：AOT 的三次挫折

![AOT兴衰时间线](/images/series/java-startup-optimization/04-aot-timeline.svg)

### 3.1 第一折：多 ClassLoader 的 static field 共享 bug

最严重的 bug 出在 AOT 如何处理 static field 上。

Java 的设计允许同一个 class 被不同 ClassLoader 加载时，各自拥有独立的 static field。这是 Java 核心语义的一部分——不同上下文中的静态变量互不干扰。Servlet 容器（Tomcat）和 Spring Boot 都重度依赖这个特性来隔离不同应用。

但 AOT 的 jaotc 在编译时，把 static field 的偏移量写死在了 native 代码里。如果两个 ClassLoader 加载了同名的类，它们各自的 static field 在不同内存位置，AOT 编译出来的代码却用同一个偏移量去访问——结果就是不同 ClassLoader 的 static field 被共享了，这在 Java 规范下是明确的语义错误。

这个 bug 在 JDK 社区以 JDK-8206963 被追踪。最终的修复方案很直接：禁止 Custom ClassLoader 加载的类使用 AOT。这意味着，Spring Boot 的 LaunchedURLClassLoader、Tomcat 的 WebappClassLoader——所有基于自定义类加载器的应用，AOT 一律无法使用。AOT 最需要的用户群体，就这样被整体排除在外。

```java
// AOT 无法覆盖的场景示例
// Spring Boot 的 fat jar 用自定义 ClassLoader 加载主类
public class SpringBootApp {
    // 所有由 LaunchedURLClassLoader 加载的类都无法使用 AOT
    public static void main(String[] args) {
        SpringApplication.run(SpringBootApp.class, args);
    }
}
```

### 3.2 第二折：编译粒度过粗导致反效果

禁止 Custom ClassLoader 后，AOT 理论上还能用于 JDK 核心库（rt.jar）。但新的问题出现了。

如果对整个 java.base 模块做 AOT 编译，生成的 .so 文件体积会达到数百 MB。加载这么大一个库本身就需要时间，而且 JDK 里大量工具类在启动阶段根本不会被调用。把不调用也编译进 .so 的代码映射到内存，不仅浪费内存，还可能因为 map 大文件拖慢启动。

在 JDK-8227439 的讨论中，Oracle 的工程师明确指出了这个矛盾：编译太多会起反作用。AOT 最终被退回实验特性状态，要求用户显式添加 `-XX:+UnlockExperimentalVMOptions` 才能启用——等于被宣告废弃，只差最后的正式移除决定。

### 3.3 第三折：JDK 16 正式删除

最终的移除决定是 JDK-8255616。2020 年，Oracle 公开宣布：Jaotc 的使用率极低，维护成本过高，决定在 JDK 16 中正式移除。

从技术角度看，这个决定合情合理。AOT 的 jaotc 依赖 Graal 编译器作为后端，而 Graal 本身就是一个复杂的一流项目，维护两套 AOT 基础设施（jaotc 和 GraalVM native-image）意味着重复投入。Oracle 的战略重心已经转向 GraalVM，集中资源远比维护一个不成熟的替代方案更划算。

但从用户角度看，这无疑是遗憾的：AOT 不是方向错了，而是生不逢时、投入不足。

### 3.4 AOT 的两种未来方向

JDK 删除 jaotc 之后，做 AOT 仍然有两条并存的技术路线：

**OpenJDK C2 做 AOT**：基于 C2 编译器直接生成 native 代码。优势是和 HotSpot 完全兼容，共享 C2 的所有优化。但 C2 本身是为 JIT 设计的，做离线编译需要大量适配工作，社区推进缓慢。

**GraalVM native-image**：将 Java 代码编译为完全独立的 native 可执行文件（不需要 JVM）。优势是启动极快、内存占用极低。代价是封闭世界假设——所有代码必须在编译时可见，动态类加载、反射等 JVM 特性需要额外配置，Spring Boot 的全面支持也经过了多年才基本成熟。

两条路各有利弊。而对于不想迁移整套运行时、只想在现有 HotSpot 上加速启动的用户来说，C2 AOT + AppCDS + Heap Archive 的组合仍然是更实际的选择。

## 4. 注意事项

（1）不要幻想 JIT 能自行解决预热问题。15000 次调用才能触发 C2，而启动阶段大多数方法的调用次数离这个门槛还很远。预热优化需要有主动手段——要么提前触发编译（预热脚本），要么绕过解释执行（AOT）。

（2）AOT 不是银弹。jaotc 的教训告诉我们，AOT 的工程代价比大多数人想象的高：静态分析必须保守、编译范围必须精确、语义兼容性必须严格验证。一个看似不起眼的 static field 隔离问题，就能让 AOT 在大半个生态中失效。

（3）如果场景允许，GraalVM native-image 是目前 AOT 最成熟的落地形态。但它有自己的学习成本和迁移代价，不是简单的加个启动参数就能用。评估时要同时考虑编译后性能、反射/动态代理的适配、构建时间等因素。

（4）做启动优化时，先量化再选方案。用 JVM 的 `-XX:+PrintCompilation` 参数查看 JIT 编译日志，搞清楚你的应用在启动阶段有多少方法被编译、多少停留在解释执行。如果发现大量热点方法长时间未编译，AOT 才是有价值的选项。

（5）Dragonwell 的 AOT 方案和 GraalVM 不冲突，选型取决于是否愿意迁移运行时。如果已经在 Dragonwell 上跑，其 AOT 和 AppCDS 共享 trace-dump-replay 基础设施，复用成本低。如果要追求极致启动速度，GraalVM native-image 是更彻底的选择。

## 5. 小结

Java 的分层编译器是它稳态性能的基石，也是它启动慢的根源之一。2000 次调用的 C1 门槛和 15000 次调用的 C2 门槛，让启动阶段绝大部分方法停留在解释执行——和 C2 编译后的性能相差 26 倍以上。AOT 试图把编译从运行时挪到构建时，方向上完全正确，但受限于多 ClassLoader 兼容性、编译粒度控制、维护成本三座大山。

JDK 16 删除 jaotc 不是 AOT 的终点。C2 AOT 这条路还在走，Dragonwell 就在做这件事——让 AOT 更好地工作，而不是另起方案。Dragonwell 将 AppCDS、Heap Archive、AOT 三项技术统一进 trace-dump-replay 流程，让类加载、类初始化、JIT 预热三个优化目标共享同一套基础设施。这是工程上极为务实的路线：不重造轮子，而是在 OpenJDK 既有能力上做深度集成。

下一篇我们把视角从 JVM 层面转向业务层面。Spring 的懒加载经常被当作启动优化的快速见效方案，但懒加载不是免费的——在某些场景下，它会造成组件静默失效的严重问题。下一篇我们就来还原一个 MQTT 消息队列因为全局懒加载而静默失效的真实排查案例。

## 参考链接

- JEP 295: Ahead-of-Time Compilation (Removed)：https://openjdk.org/jeps/295
- JDK-8206963：多 ClassLoader 下 AOT 的 static field 共享 bug：https://bugs.openjdk.org/browse/JDK-8206963
- JDK-8227439：AOT 退回实验特性：https://bugs.openjdk.org/browse/JDK-8227439
- JDK-8255616：JDK 16 移除 Jaotc 和 Graal 编译器：https://bugs.openjdk.org/browse/JDK-8255616
- HotSpot Tiered Compilation（分层编译）：https://docs.oracle.com/en/java/javase/17/vm/jit-compiler.html
- GraalVM Native Image：https://www.graalvm.org/latest/reference-manual/native-image/
- Alibaba Dragonwell：https://github.com/alibaba/dragonwell11
- JMH 官方教程：https://openjdk.org/projects/code-tools/jmh/
