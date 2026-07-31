# Java启动速度优化解读 · 系列导览

> 技术栈：Java + HotSpot JVM + Spring Boot + Dragonwell
> 适用场景：当你困惑于 Java 应用为什么启动慢、想知道 JVM 层面有哪些加速手段、或者正在实践 Spring 懒加载等启动优化方案时，本系列帮你从根因到方案到实战，形成完整认知。

Java 的高性能令人印象深刻，但启动慢同样令人印象深刻——笨重缓慢的刻板印象大多来源于此。高性能和快启动是否可以兼得？阿里云 JVM 团队的 Dragonwell 给出了答案：AppCDS、Heap Archive、AOT 三项技术攻关了 JVM 可见的启动耗时，而 Spring 懒加载等业务层面手段则有自己的代价与边界。

本系列把阿里云开发者社区原文《探究Java应用的启动速度优化》和实战排查《Spring 全局懒加载导致 MQTT 静默失效》两篇素材，解读式重写为 6 篇图文并茂的文章，覆盖从根因分析到优化方案到实战案例的完整路径。

## 阅读路径

| 序号 | 文章 | 核心问题 |
|:---|:---|:---|
| 01 | [Java为什么启动慢](./01-Java为什么启动慢.md) | 高性能与快启动的矛盾，三大根因是什么？ |
| 02 | [类加载与AppCDS优化](./02-类加载与AppCDS优化.md) | 类加载为什么慢？AppCDS 怎么加速？Custom ClassLoader 场景怎么办？ |
| 03 | [类提前初始化与Heap Archive](./03-类提前初始化与HeapArchive.md) | 静态块执行开销多大？Heap Archive 如何持久化堆对象？ |
| 04 | [JIT预热与AOT编译的兴衰](./04-JIT预热与AOT编译的兴衰.md) | 解释执行慢多少？AOT 为什么命途多舛？Dragonwell 怎么接续？ |
| 05 | [Spring懒加载实战：MQTT静默失效](./05-Spring懒加载实战：MQTT静默失效.md) | 懒加载真的加速了吗？为什么 MQTT 连不上？什么时候不该用？ |
| 06 | [启动加速最佳实践与展望](./06-启动加速最佳实践与展望.md) | Dragonwell + SAE 如何落地？trace-dump-replay 是什么？未来方向在哪？ |

## 参考链接

- [探究 Java 应用的启动速度优化（阿里云开发者社区）](https://developer.aliyun.com/article/788442)
- [JEP 295: AOT Compilation](https://openjdk.org/jeps/295)
- [JEP 310: Application Class-Data Sharing](https://openjdk.org/jeps/310)
- [Alibaba Dragonwell](https://dragonwell.github.io/)
