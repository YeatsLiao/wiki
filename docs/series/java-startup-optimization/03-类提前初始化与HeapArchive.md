# 类提前初始化与Heap Archive

> 技术栈：HotSpot JVM + AppCDS + Heap Archive + Dragonwell
> 适用场景：类初始化（static 块和静态字段赋值）成为启动瓶颈，希望将其作为归档的一部分一劳永逸

## 0 写在前面

上一篇我们把类加载拆成了查找和解析两段，用 AppCDS 优化了解析，用 JAR Index 优化了查找。但类加载这条链路还没走完——当 InstanceKlass 已经构建完毕，类加载器会触发最后一个步骤：类初始化。

这一步执行的是 `<clinit>`，也就是你在代码里写的 static 代码块和静态变量的赋值逻辑。`IntegerCache` 加载时要把从 -128 到 127 的整数对象全部预分配，配置解析器要把 properties 文件读出来塞进静态 Map，数据库连接池要检查驱动版本——这些操作在每次 JVM 启动时都要重新执行一遍，就算用上了 AppCDS，也省不掉。

那能不能把类初始化的结果也像 InstanceKlass 一样冻结下来，下次启动直接复用？答案是可以，但比想象中复杂得多。这涉及 JVM 将堆对象持久化到磁盘、再用内存映射加载回来的能力，就是这篇要讲的 Heap Archive。

## 1. 问题背景：类初始化的本质与代价

### 1.1 类初始化到底做了什么

JVM 规范要求每个类在首次被主动使用之前完成初始化，具体由 `<clinit>` 方法承载。`<clinit>` 是编译期合成的，包含了：

- 所有静态变量的赋值语句（源文件中写的 `static int x = 42;`）
- 所有 static 代码块（`static { ... }`）

JVM 保证 `<clinit>` 在多线程环境下只执行一次，且只有一个线程进入执行，其余线程阻塞等待。这是由 JVM 内部类初始化锁保证的，开发者无需自己加锁。

这个机制本身设计得很好，但问题出在：即便你的 static 块做的事再简单——比如只是构造几个不可变对象、初始化缓存表——每次启动都要重新执行这些 bytecode，以解释方式逐条走完。对于大型框架，累积起来可能涉及成千上万个类的初始化，每一条 bytecode 都要解释执行，耗时不可忽略。

### 1.2 static field 的两种初始化模式

来看看 static field 初始化在 JVM 底层到底意味着什么。以 `IntegerCache` 为例：

```java
// JDK 内部的 IntegerCache（简化示意）
private static class IntegerCache {
    static final Integer[] cache;
    static {
        cache = new Integer[256];
        for (int i = 0; i < 256; i++) {
            cache[-128 + i] = new Integer(i);
        }
    }
}
```

这个 static 块做的事本质上就两件：（1）在堆上分配一个数组对象，（2）往数组里填 Integer 对象。这些对象创建完成后，在整个 JVM 生命周期内都不会改变。但每次启动，JVM 都要老老实实分配内存、构造对象、跑一遍循环。

如果能把这些已经稳定的 static field 对象直接持久化，下次启动跳过 `<clinit>` 的执行，就能省下这部分开销。这个思路很直观，但 Java 对象和 C 的 `mmap` 之间有本质差异。

## 2. 设计理念

### 2.1 从 C 的 mmap 到 Java 的困境

C 语言做持久化加载最高效的手段是 `mmap`——把文件直接映射到进程地址空间，读文件就像读内存：

```c
// C 语言：直接把数据文件映射到内存
int fd = open("snapshot.data", O_RDONLY);
struct CacheData* cache = mmap(NULL, sizeof(*cache),
    PROT_READ, MAP_PRIVATE, fd, 0);
// 此时 cache 已经指向了有效的数据结构，零拷贝、零解析
```

映射完成后，文件内容直接出现在进程地址空间里，指针就能用，不需要反序列化、不需要内存分配。但为什么 Java 不能照搬这个方案？

因为 Java 对象不是 pure data。一个 Java 对象在内存中的布局至少包含：

- **Mark Word**（8 字节）：GC 标记、锁状态、hashCode 等运行时信息，这些值依赖当前 JVM 进程的状态
- **Klass Pointer**（压缩后 4 字节）：指向 InstanceKlass 元信息的指针，这个指针在不同 JVM 进程中指向不同的地址

也就是说，即便你能把一片 Java 堆对象 raw dump 到磁盘，下次启动时这些 Mark Word 和 Klass Pointer 也全都对不上——GC 的标记位变了、锁状态变了、klass 元信息在新的进程里地址也变了。直接 mmap 回来的对象要么 crash，要么 GC 直接认为它们是非法对象回收掉。

所以 Heap Archive 不能简单地把堆内存 dump 出来再映射回去，它需要一套额外的元信息修复机制。

### 2.2 AppCDS 打下的基础：Klass 元信息的持久化

Heap Archive 的关键依赖，正好是上一篇讲的 AppCDS。

前面说过，AppCDS 把 InstanceKlass 结构持久化到了 .jsa 文件里。这就意味着，下一次启动时，JVM 可以通过 mmap 拿到一模一样的 InstanceKlass 结构，而且它所在的内存地址是固定的（因为是只读映射到固定区域）。

这就解决了 Klass Pointer 的问题：如果 InstanceKlass 被持久化了，那么堆对象里的 Klass Pointer 就可以指向这个持久化的 klass 地址，而不再是每次启动随机分配的新 klass。换句话说，Heap Archive 里每个对象的类型信息是可以复用的。前提是，这个对象指向的 InstanceKlass 必须也在归档里。

这也是为什么 Heap Archive 必须建立在 AppCDS 之上：没有 AppCDS 先行把类的元信息固定下来，Heap Archive 里的对象就是一堆无法恢复类型的悬空指针。

### 2.3 Closed Archive 与 Open Archive：两级设计

Heap Archive 在实现上分成了两级，有本质区别：

**Closed Archive（封闭归档）**——只读、不可写、不引用堆对象。

Closed Archive 里的对象满足一个严格约束：它们不持有任何指向堆上非归档对象的引用。这意味着 GC 运行时，Closed Archive 完全是透明的——不需要扫描、不需要修正指针、不需要考虑对象移动。就像这堆对象不存在一样。代价是这些对象必须是 immutable 的，并且它们的引用关系必须在归档时刻就是完全自包含的。

**Open Archive（开放归档）**——可写、可引用任意对象。

Open Archive 解除了一切限制：它的对象可以指向堆上的任意对象，也可以被堆上的任意对象指向。但这也意味着 GC 必须像处理普通堆对象一样处理它们——标记、移动、修正引用，整套流程一个不少。Open Archive 省的是对象创建和初始化的开销，但不省 GC 开销。

为什么会需要 Open Archive？因为现实中大多数缓存的 static field，都不可避免地要和其他运行时对象打交道。`IntegerCache` 这种纯自包含的例子反而是少数。Open Archive 用额外的 GC 开销换来了更广的适用面。

![Closed Archive与OpenArchive引用限制](/images/series/java-startup-optimization/02-cds-memory-mapping.png)

### 2.4 Closed Archive 为什么要求只读且不引用堆对象

关于 Closed Archive 最为精妙的设计就在于一个约束：如果 Closed Archive 中的对象 A 引用了堆上的对象 B，那么当 B 在 GC 中被移动时，GC 必须修正 A 中指向 B 的字段。但 Closed Archive 的内存页是只读映射的，根本没法写入。

这就成了一个死锁：要修正引用就必须可写，但可写就会引入 GC 扫描和修正的开销，失去 Closed Archive 零 GC 开销的优势。所以 Closed Archive 从设计上就直接禁止了这种引用关系的存在——不引用堆对象，GC 就完全不用管它，也就没有只读带来的矛盾。

这也是为什么区分 Closed Archive 和 Open Archive 两级设计是必要的：如果你确定某些 static field 是纯自包含的（比如 IntegerCache、某些字面量池），就让它们进 Closed Archive 享受零 GC 开销；如果 static field 必然要和其他对象交互，就退而求其次进 Open Archive——至少省了初始化开销。

## 3. 实际应用

### 3.1 类初始化 + Heap Archive 的配合流程

整个流程可以概括为：把类初始化成果冻成冰棍，下次启动直接啃。

（1）Dump 阶段：应用在首次运行、充分预热后，JVM 把已完成初始化的类的 static field 对象导出到 .jsa 文件的 Heap Archive 区域。同时，AppCDS 已经把这些类对应的 InstanceKlass 写入了同一个 jsa 文件的 Klass 区域。

（2）启动加载阶段：启动时，JVM 先从 .jsa 中 mmap 出 InstanceKlass 区域，完成类加载的解析跳过。然后加载 Heap Archive 区域，用映射进来的对象填充各 InstanceKlass 的 static field 指针。

（3）初始化完成：static field 已指向归档对象，JVM 认为这个类的 `<clinit>` 已经等效完成，不再执行静态代码块。

```java
// 举例：某个配置类的初始化
public class ConfigLoader {
    static final Map<String, String> configs;
    static {
        configs = new HashMap<>();
        // 大量文件读取和解析逻辑...
        loadFromFile(configs, "/path/to/config.properties");
    }
}
```

在没有 Heap Archive 时，每次启动都要跑 `loadFromFile`。有 Heap Archive 后，这个 static 块完全跳过，`configs` 直接指向归档里已经填充好的 HashMap。

![类初始化与Heap Archive配合流程](/images/series/java-startup-optimization/03-heap-archive-flow.svg)

### 3.2 Dragonwell 的 trace-dump-replay 统一流程

阿里巴巴 Dragonwell 将 AppCDS + Heap Archive + AOT 三项技术统一进了 trace-dump-replay 流程：

- **trace**：在应用首次运行时，JVM 记录下哪些类被加载过、哪些方法被调用过、哪些类完成了初始化。这个 trace 文件就是后续 dump 的基础。
- **dump**：基于 trace 文件，JVM 重新加载指定类直到完成初始化，然后进行一次完全 GC 将对象整理到稳定的老年代，最后把 InstanceKlass 和 Heap 中的 static field 导出到 jsa 文件。
- **replay**：应用启动时加载 jsa，InstanceKlass 直接映射，static field 直接指向归档对象，跳过 `<clinit>` 执行。

```bash
# trace 阶段：收集类加载和初始化信息
java -XX:+UnlockExperimentalVMOptions \
     -XX:+EnableJVMCI \
     -Xbootclasspath/a:dragonwell.jar \
     -jar your-app.jar

# dump 阶段：基于 trace 生成 jsa（包含 Heap Archive）
java -Xshare:dump \
     -XX:SharedClassListFile=app.lst \
     -XX:SharedArchiveFile=app.jsa \
     -XX:+EnableJVMCI

# replay 阶段：使用归档启动
java -Xshare:on \
     -XX:SharedArchiveFile=app.jsa \
     -XX:+EnableJVMCI \
     -jar your-app.jar
```

这套流程把类加载、初始化的重复劳动一次做完、持久保存，剩下的就是每次启动时的大量跳过。

## 4. 注意事项

（1）Heap Archive 要求对象在 GC 的 stable 状态下导出。如果在 dump 之前对象还处于新生代、随时可能被移动，导出的引用关系可能失效。Dragonwell 的做法是在 dump 前触发一次 Full GC 将对象提升到老年代，确保导出内容的稳定性。自己实现类似方案时要注意这个时序要求。

（2）不是所有 static field 都能进 Heap Archive。如果静态字段的值在每次启动时都必须重新计算（比如依赖环境变量、当前时间的值），那归档的值就是错的。区分"稳定的初始化"和"每次必须重算的初始化"是做 Heap Archive 优化时的基本判断。

（3）Closed Archive 的条件非常苛刻。你要确保归档对象以及它的所有引用链路都落在归档范围内——只要有一环引用了堆上的动态对象，就不能进 Closed Archive。如果不确定，先走 Open Archive 观察效果。

（4）jsa 文件的 Heap Archive 区域会让归档体积显著增大。几个 GB 的 jsa 文件并不罕见，要确保部署环境有足够的磁盘空间和映射内存。如果磁盘 IO 带宽紧张，过大的归档反而拖慢映射加载。

（5）类和依赖版本变更后要重新 dump。更新了 JDK 版本、升级了依赖 jar、修改了类结构——任何影响 InstanceKlass 布局或 static field 内容的变化，都需要重新生成 jsa，否则要么匹配失败回退，要么更糟——拿到了错的对象。

## 5. 小结

类初始化是类加载链路中的最后一环。AppCDS 把 InstanceKlass 构建省了，Heap Archive 接着把 `<clinit>` 执行省了。至此，一个类从磁盘到完全可用，理论上只需要一次内存映射——查找路径上的 JAR Index、解析路径上的 AppCDS、初始化路径上的 Heap Archive，三者联合发力，类加载这条线才算真正打通。

但打通了类加载，还有一道槛横在前面：就算类都准备好了，方法执行仍然以解释方式跑在 JVM 上。同一个方法，解释执行和 JIT 编译后的性能差距高达数十倍。启动阶段大部分方法等不到 C2 编译就已经执行完了。怎么办？下一篇我们就来看 JIT 预热和 AOT 编译这条跌宕起伏的技术路线——它一度被认为是启动加速的终极答案，却又在 JDK 16 中被正式删除。

## 参考链接

- JEP 310: Application Class-Data Sharing：https://openjdk.org/jeps/310
- JVM Specification §5.5 Initialization：https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html#jvms-5.5
- HotSpot Class Data Sharing 源码：https://github.com/openjdk/jdk/tree/master/src/hotspot/share/cds
- Alibaba Dragonwell：https://github.com/alibaba/dragonwell11
- Dragonwell Quick Start（AppCDS + Heap Archive）：https://dragonwell-java.io/
