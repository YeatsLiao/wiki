# Java启动速度优化 · Java为什么启动慢

> 技术栈：HotSpot JVM + JIT 编译器 + Spring Boot
> 适用场景：理解 Java 冷启动慢的根本原因，为后续优化方案选型打基础

先抛一个反直觉的事实：在主流语言执行效率排行里，Java 稳居第一梯队，大约是 C 的一半，仅次于 C、Rust、C++，远高于 Python、Ruby。但只要你写过 Java 服务，大概率经历过它的冷启动之慢——一个最简单的 Spring Boot 程序，启动动辄两三秒。

同样是 Hello World，Node.js 眨眼就起来，Go 编译出来的二进制几乎瞬间响应，为什么偏偏 Java 这么慢？

要回答这个问题，得先把根因分清楚：不是 JIT 不行——HotSpot 的 C2 是业界最先进的 JIT 设计之一。真正的根因，来自框架膨胀、WORA 的动态类加载、以及 JIT 预热机制三个方面。这篇逐一拆解。

![主流语言执行效率排行](/images/series/java-startup-optimization/01-language-efficiency.png)

## 1.问题背景：Java 启动慢到底慢在哪

先说结论：Java 启动慢，不是某一处慢，而是三个阶段叠在一起。

- **框架本身的初始化开销**：现代 Java 应用几乎都跑在 Spring Boot 这类框架上，为了支持依赖注入、自动装配、条件加载，启动时扫描大量元数据、加载大量类。
- **类加载（Class Loading）**：Java 的 WORA（一次编译到处运行）把链接推迟到了运行时。每个类都要在首次使用时才被找到、校验、解析——灵活性换来的代价就是启动开销。
- **JIT 预热**：HotSpot 默认先解释执行字节码，等热点足够高才触发 JIT 编译。应用刚启动时跑的是尚未编译优化的代码，性能远达不到稳态水平。

把这三段加起来，就是 Java 冷启动的全部原罪。下面分别展开。

![Java启动慢三大根因](/images/series/java-startup-optimization/01-three-root-causes.svg)

## 2.设计理念：三大根因拆解

### 2.1 框架复杂度爆炸

来看一组对比数据。一个 Spring Boot 最简单的 Hello Web 程序，启动时加载的 class 数量大约是 7404 个；而同样功能的 Node.js express 程序，加载的 js 文件只有 55 个左右——差了两个数量级。

这不是 Spring 的错，而是 Java 生态成熟度的副作用。Spring 为了做到约定优于配置，底层堆叠了大量反射、注解扫描、BeanDefinition 注册逻辑，每一个 auto-configuration 背后都牵连出一串依赖类。

更麻烦的是，这些开销几乎都是必须的——你没法简单地删掉某个类，因为框架在运行时要靠它们做决策。这注定了框架优化是长期工程，短期内我们能做的主要是后两件事：加速类加载、缓解预热开销。

### 2.2 WORA 带来的动态类加载代价

一个类从磁盘到可用，要经历五步：

| 步骤 | 操作 | 开销分析 |
|------|------|---------|
| JAR 包遍历 | classpath 上每个 jar 逐个打开 zip 查找目标类 | 大规模 classpath 下 IO 和解压开销远超直觉 |
| class 文件查找 | 在 jar 内部按目录结构定位 .class 文件 | 同上 |
| 校验（Verification） | 检查字节码合法性 | 必要但可缓存 |
| 解析（Resolution） | 把 class 文件解析成 InstanceKlass 结构 | 内存分配和结构填充开销大 |
| 初始化 | 执行静态变量赋值和 static 块 | 取决于静态块逻辑 |

第 1 步在大规模 classpath 下尤其昂贵。假设 classpath 上有 2000 个 jar，加载一个类平均要访问约 1000 个 zip 文件（命中前的那一半）。第 4 步也不便宜，InstanceKlass 的构建涉及大量内存分配和结构填充。WORA 换来了跨平台和动态加载能力，但启动时这些便利全都变成了成本。

### 2.3 JIT 预热：解释执行与编译执行的鸿沟

HotSpot 采用分层编译（Tiered Compilation）策略：先解释执行，等热点出现再逐步编译。默认阈值：

- Tier 3（C1 编译）：方法调用约 2000 次后触发
- Tier 4（C2 编译）：方法调用约 15000 次后触发

解释执行和 C2 编译后的代码相比，性能差距大约在 26 到 50 倍。启动阶段你的 Java 程序以慢动作在跑——既包括框架初始化逻辑，也包括第一次请求处理时还没被编译的关键路径。这就是为什么很多服务第一次请求延迟比稳态高一个数量级：不是网络问题，是 JIT 还没热起来。

## 3.实际应用：用数据说话

### 3.1 用 -verbose:class 观察类加载规模

```bash
java -verbose:class -jar your-app.jar 2>&1 | grep "class,load" | wc -l
```

输出逐行打印每个被加载的类：

```
[0.234s][info][class,load] org.springframework.boot.SpringApplication source: ...
[0.235s][info][class,load] org.springframework.context.support.GenericApplicationContext source: ...
```

典型 Spring Boot Web 项目加载类数量轻松突破 7000。对比等价的 Node express 程序，require 的文件数只有几十个——这个数量级差距就是类加载优化的核心战场。

### 3.2 用 JMH 看 JIT 预热的差距

```java
@State(Scope.Thread)
@BenchmarkMode(Mode.Throughput)
public class HessianSerializeBenchmark {
    private HessianSerializer serializer;
    private DataObject data;

    @Setup
    public void setup() {
        serializer = new HessianSerializer();
        data = DataObject.build();
    }

    @Benchmark
    public byte[] serialize() {
        return serializer.serialize(data);
    }
}
```

跑出来的数据通常显示：首次调用吞吐只有稳态的几十分之一。随着 JIT 逐层编译（C1 → C2），吞吐阶梯式上升，约 15000 次调用后趋于稳定。这也解释了为什么短生命周期任务（Serverless 函数、CLI 工具）对 Java 这么不友好：任务都跑完了，JIT 还没编译完。

## 4.注意事项

- **不要把启动慢简单归咎于 JVM**：HotSpot 本身的启动开销其实很小，绝大部分时间花在框架初始化和类加载上。优化方向应聚焦在减少不必要的类加载，而非怀疑 JVM 实现。
- **分层编译阈值可调，但不要盲目调小**：过早编译冷代码反而拖慢启动——编译本身也有开销。这个权衡要结合应用特点实测。
- **类加载量是框架复杂度的晴雨表**：用 `-verbose:class` 发现加载类数量异常高，往往意味着依赖过多或配置过重，本身就是值得治理的信号。
- **启动优化要分阶段做**：先量化（搞清楚类加载、初始化、预热各占多少），再针对性优化。

## 5.小结

回到开头那个反直觉问题：Java 启动慢，不是因为它跑得慢，而是因为它把很多本该在编译期做的事情推迟到了运行时——动态类加载和 JIT 预热，都是为了灵活性付出的启动税。

三大根因里，框架复杂度是生态的既有现实，短期难改；JIT 预热可以通过预热脚本、AOT 等手段缓解；而类加载这一块，恰恰是优化空间最大、性价比最高的一环——让那些反复加载的类不必每次都走完整的查找-校验-解析流程。

下一篇就来拆解类加载的内部流程，以及第一个重量级优化方案——AppCDS。

## 参考链接

- JIT 编译器与分层编译：https://docs.oracle.com/en/java/javase/17/vm/jit-compiler.html
- HotSpot C2 与 Sea-of-Nodes：https://wiki.openjdk.org/display/HotSpot/Internals
- JMH 官方教程：https://openjdk.org/projects/code-tools/jmh/
- Java 类加载机制规范：https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html
