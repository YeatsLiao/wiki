# Java启动速度优化 · 类加载与AppCDS优化

> 技术栈：JVM 类加载子系统 + CDS/AppCDS + JAR Index
> 适用场景：类加载开销过大导致启动慢，想用共享归档或索引加速类查找

上一篇我们拆解了 Java 启动慢的三大根因，其中类加载是最值得优化的一环。但类加载到底慢在哪一步？是查找 class 文件慢，还是解析慢，还是初始化慢？

直觉上大家会觉得解析（把 class 文件变成 InstanceKlass）是最贵的。但真实场景往往相反：在大型项目动辄上千个 jar 包的 classpath 下，光是把目标类从一堆 jar 里找出来这一步，开销就已经超过了 InstanceKlass 的解析。这也是为什么 AppCDS 这类看似优雅的方案，在面对 Custom ClassLoader 时会显得力不从心——它优化的是解析，而不是查找。

这篇就来把类加载流程、InstanceKlass 结构、CDS/AppCDS 原理，以及被遗忘的 JAR Index 方案一次讲透。

## 1.问题背景：类加载到底做了什么

把一个类从磁盘加载到可用，JVM 内部经历的核心步骤可以简化为：

（1）JAR 包遍历：按 classpath 顺序，逐个打开 jar（本质是 zip）查找目标类的 .class 文件。
（2）class 文件读取：定位到 jar 内的 .class 后，读出字节流。
（3）校验（Verification）：检查魔数、版本、字节码合法性。
（4）解析（Resolution）：把字节流解析为 JVM 内部的 InstanceKlass 结构。
（5）初始化：执行 `<clinit>`，即静态变量赋值和 static 块。

前两步是查找，后三步是处理。AppCDS 这类方案优化的主要是第（4）步——把解析产物缓存起来复用。但要理解它为什么有效、又为什么有局限，得先看看 InstanceKlass 长什么样。

## 2. 设计理念

### 2.1 InstanceKlass：class 文件在 JVM 里的最终形态

class 文件只是一串平台无关的字节流，JVM 拿到后要把它翻译成内部可直接使用的结构，这个结构就是 InstanceKlass（在 HotSpot 源码里就叫 InstanceKlass）。它大致包含以下内容：

- 常量池（ConstantPool）：class 文件里的常量池解析后的结构，存放字符串、符号引用等。
- 方法表：每个方法的字节码、异常表、局部变量表等。
- 字段表：实例字段和静态字段的元数据、偏移量。
- 父类和接口指针：维护继承关系。
- vtable 和 itable：虚方法表和接口方法表，支撑多态分派。
- 访问标志、类加载器引用、初始化状态等管理信息。

可以看到，InstanceKlass 的构建涉及大量内存分配、符号解析、表结构填充。这部分开销在每个类首次加载时都要付一次，而且对同一个应用每次启动都重复付——这就是 CDS 想要消除的重复劳动。

### 2.2 CDS/AppCDS：把解析产物搬到磁盘再映射回来

CDS（Class Data Sharing）的核心思路很直接：既然 InstanceKlass 每次启动都要重新构建，那不如把它直接 dump 到一个磁盘文件（.jsa），下次启动时用内存映射（mmap）直接读进来用。

关键在于，.jsa 文件里存的不是 class 字节流，而是已经解析完成的 InstanceKlass 结构，内存布局与运行时完全一致。这意味着运行时只需要建立一段只读内存映射，就能直接拿到现成的 InstanceKlass，省掉了校验、解析全过程。

CDS 最早只支持 Java 核心库（rt.jar 那部分），后来扩展出 AppCDS（Application Class Data Sharing），把应用类和依赖库类也纳入共享范围。使用流程一般是三步：

```bash
# 1. 生成待归档类列表
java -Xshare:off -XX:DumpLoadedClassList=app.lst -jar your-app.jar

# 2. 基于列表生成 jsa 归档
java -Xshare:dump -XX:SharedClassListFile=app.lst -XX:SharedArchiveFile=app.jsa -jar your-app.jar

# 3. 启动时使用归档
java -Xshare:on -XX:SharedArchiveFile=app.jsa -jar your-app.jar
```

AppCDS 对启动加速的效果相当可观，尤其在类加载量大的 Spring Boot 应用上，能省掉一截可观的解析时间。

![类加载流程与AppCDS优化点](/images/series/java-startup-optimization/02-classloading-appcds.svg)

### 2.3 AppCDS 对 Custom ClassLoader 的力不从心

但 AppCDS 有个绕不开的局限：它对自定义类加载器（Custom ClassLoader）支持得很别扭。

原因在于 AppCDS 匹配归档类的方式。对于一个类，JVM 要确认 jsa 里这个 InstanceKlass 就是你现在要加载的那个类，才能直接复用。对系统类加载器加载的类，路径确定、来源明确，匹配很直接。但 Custom ClassLoader 不一样，它的加载逻辑是黑盒。

为了支持 Custom ClassLoader，AppCDS 不得不走一套额外流程：

（1）先调用 ClassLoader 的 loadClass() 拿到 class 的 byte stream（字节流）。
（2）对 byte stream 计算 checksum。
（3）用 checksum 去匹配 jsa 里的归档。

问题来了：这套流程里，第（1）步——拿到 byte stream——本身就包含了 JAR 包遍历、zip 查找、文件读取的全部开销。也就是说，AppCDS 在 Custom ClassLoader 场景下，只省掉了校验和解析，却没省掉查找。而前面说过，在大 classpath 下，查找往往才是大头。

这就是 AppCDS 看似优雅却在复杂应用里效果打折的根本原因：它优化的环节不对症。

## 3. 实际应用

### 3.1 真实场景下的查找开销

来算一笔账。假设 classpath 上有 N=2000 个 jar 包，要加载一个类，最坏情况要遍历所有 jar，平均情况访问约 N/2=1000 个 jar。每访问一个 jar，都要打开 zip、读取中央目录、匹配条目，这是一笔实打实的 IO 和 CPU 开销。

当类数量达到数千个时，这个查找开销累加起来非常可观，往往远超 InstanceKlass 的解析开销。有实测数据显示，在这种规模下，类加载的总时间里查找占比能超过一半。

这也解释了一个现象：同样是 AppCDS，在类少、classpath 短的应用上效果显著，但在 jar 包成百上千的大型应用上提升有限——因为大头不在它优化那条链路上。

### 3.2 JAR Index：被遗忘的加速方案

其实 JDK 很早就提供了针对查找这个环节的优化方案：JAR Index。它的原理很简单——为 jar 包建立索引，让类查找直接定位到目标 jar，而不是逐个遍历。

具体做法是在 jar 里放一个 INDEX.LIST 文件，记录哪个类在哪个 jar 里的映射关系，加载时用类似 HashMap 的方式直接查表，把 O(N) 的遍历变成 O(1) 的查找。

```text
# INDEX.LIST 大致结构示意
JarIndex-Version: 1.0

spring-core-5.3.jar
org/springframework
org/util

spring-beans-5.3.jar
org/springframework/beans
```

听起来很美好，但 JAR Index 太古老了，实际用起来障碍重重：

（1）只支持 URLClassLoader，对自定义类加载器无效。
（2）需要 jar 的 MANIFEST 里配置 Class-Path 属性，现代构建工具很少这么打包。
（3）要求索引 jar 出现在 classpath 的前面位置，部署方式受限。
（4）jarindex 工具链陈旧，Spring Boot 的 fat jar 结构根本不支持。

这些限制导致 JAR Index 在现代 Java 应用里几乎是个传说——大家都知道有这东西，但没人真用得上。

![JAR Index原理](/images/series/java-startup-optimization/02-jar-index.svg)

### 3.3 Dragonwell 的 agent 注入方案

阿里巴巴的 Dragonwell（基于 OpenJDK 的发行版）针对 JAR Index 难用的问题，给了一个工程化解法：通过 agent 注入的方式，在应用启动时动态生成正确的 INDEX.LIST，绕开手动打包的限制。

思路是利用 javaagent 的 Instrumentation 能力，在类加载流程的早期介入，扫描实际 classpath 上的 jar 包关系，自动构建索引并注入到类加载逻辑里。这样既不用改构建流程，也不用依赖 fat jar 配合，就能让 JAR Index 在现代应用上生效。

```java
// agent 介入的大致思路（伪代码）
public class IndexAgent implements ClassFileTransformer {
    public static void premain(String args, Instrumentation inst) {
        // 1. 扫描 classpath 上所有 jar
        Map<String, String> classToJar = scanClassPath();
        // 2. 构建 HashMap 形式的索引
        JarIndex index = buildIndex(classToJar);
        // 3. 注入到类加载查找逻辑
        ClassLoaderHooks.installIndex(index);
    }
}
```

这套方案结合 AppCDS，等于把类加载的查找和解析两个环节分别优化：JAR Index 加速查找，AppCDS 加速解析，叠加起来才能覆盖大 classpath 场景的全部开销。

## 4. 注意事项

（1）AppCDS 不是万能药。它优化的是解析环节，对 Custom ClassLoader 场景下的查找开销无能为力。评估效果时要结合自己的 classpath 规模和类加载器结构，不能只看官方 benchmark。

（2）生成 jsa 归档要基于真实的类加载列表。用生产环境实际启动时的类列表来 dump，才能保证归档命中率。漏掉常用类会让 AppCDS 退化为部分生效。

（3）JAR Index 的原生限制很多，不要指望直接套用。如果要用，优先考虑 Dragonwell 这类带 agent 注入的发行版方案，而不是手动维护 INDEX.LIST。

（4）类加载优化要先量化再下手。用 `-verbose:class` 配合启动耗时拆分，搞清楚查找、解析、初始化各占多少，再决定是上 AppCDS、上 JAR Index，还是两者都要。

（5）jsa 文件与 JDK 版本和 classpath 强绑定。升级 JDK 或更换依赖后要重新生成归档，否则会匹配失败、静默回退到正常加载，优化反而失效。

## 5. 小结

类加载的开销分布在查找和解析两段链路上。AppCDS 用内存映射消除了重复解析的代价，是类少场景下的利器；但在大 classpath、Custom ClassLoader 场景下，查找开销才是大头，这时还得靠 JAR Index 这类索引方案来补位。两者搭配，才算把类加载这条链路优化到位。

不过，类加载只是启动开销的一部分。即便类都加载好了，每个类的静态块、静态字段初始化仍然要在每次启动时执行一遍，这部分开销 AppCDS 也帮不上忙。下一篇我们就来看怎么把初始化也提前冻结下来——类提前初始化与 HeapArchive 技术。

## 参考链接

- CDS / AppCDS 官方文档：https://docs.oracle.com/en/java/javase/17/vm/class-data-sharing.html
- JAR File Index 规范：https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html#JAR_Index
- HotSpot InstanceKlass 源码：https://github.com/openjdk/jdk/blob/master/src/hotspot/share/oops/instanceKlass.hpp
- Dragonwell 项目：https://github.com/alibaba/dragonwell8
- Java 类加载机制规范：https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html
