# Chris Newland JVM 工具解读 · 系列导览

> 技术栈：JVM / HotSpot + 一套免费开源的在线工具矩阵
> 适用场景：当你想搞清楚 `-XX` 参数是什么意思、JIT 对你的代码做了什么、GC 该怎么选、Java 下个版本加什么时，本系列带你把 Chris Newland 的整套 JVM 工具用起来。

HotSpot 内部发生的事几乎全是不透明的：参数含义、JIT 优化、内建函数替换、GC 可用性、JEP 演进路线……这些「没人说得清」的事，被伦敦金融软件开发者 Chris Newland（@chriswhocodes）用业余时间拆成了十几个能直接在浏览器打开、能搜索、能对比的工具——全部免费、开源、一个人维护。

本系列共 10 篇，从总览到各工具逐层拆解。建议先看 01 总览建立全局视角，再按需要跳读。素材来自各公开工具站点（byte-me.dev / chriswhocodes.com / jacoline.dev）及其源码与文档，经本系列重新组织为解读式文章。

## 阅读路径

| 序号 | 文章 | 讲什么 | 对应工具 / 页面 |
| :--- | :--- | :--- | :--- |
| 01 | [总览：一个人与一套JVM工具矩阵](./01-总览：一个人与一套JVM工具矩阵.md) | 作者缘起 + 工具矩阵全图，建立全局视角 | byte-me.dev 导航总览 |
| 02 | [VM Options Explorer：把HotSpot参数内部机制拆开](./02-VMOptionsExplorer：把HotSpot参数黑盒拆开.md) | 参数查询 + 跨版本 / 跨发行版差异对比 | vm-options-explorer.html |
| 03 | [hsdis：让JIT说出机器语言](./03-hsdis：让JIT说出机器语言.md) | 反汇编插件，把 JIT 产物变成可读汇编 | hsdis/ |
| 04 | [JITWatch：看懂HotSpot在你的代码上做了什么](./04-JITWatch：看懂HotSpot在你的代码上做了什么.md) | 桌面日志可视化，内联 / 热点 / 字节码↔汇编对照 | JITWatch（桌面） |
| 05 | [JaCoLine：给你的启动脚本做个体检](./05-JaCoLine：给你的启动脚本做个体检.md) | 命令行参数校验，揪出废弃 / 拼写错误 | jacoline.dev/inspect |
| 06 | [Byte-Me：在浏览器里看Java怎么变成字节码](./06-ByteMe：在浏览器里看Java怎么变成字节码.md) | 在线字节码浏览器 + JEP 落地示例 | byte-me.dev |
| 07 | [JEP三件套：摸透Java的演进路线图](./07-JEP三件套：摸透Java的演进路线图.md) | 按项目 / 版本 / 全文检索 JEP | JEPMap / JEPSearch / FullJEP |
| 08 | [VM Intrinsics Explorer：被HotSpot自动替换的内建方法](./08-VMIntrinsicsExplorer：被HotSpot偷偷换掉的魔法方法.md) | 内建函数清单，理解「为什么这段代码这么快」 | vm-intrinsics-explorer.html |
| 09 | [GC Explorer：把垃圾回收器摊开给你看](./09-GCExplorer：把垃圾回收器摊开给你看.md) | 各 JDK / 发行版 GC 可用性矩阵 | gc-explorer.html |
| 10 | [Optimizing Java：把性能调优写成一本书](./10-OptimizingJava：把性能调优写成一本书.md) | 方法论收尾，从工具走向体系化认知 | 《Optimizing Java》 |

## 参考链接

- [Chris Newland 主页 chrisnewland.com](https://www.chrisnewland.com/)
- [byte-me.dev 总入口](https://byte-me.dev/)
- [VM Options Explorer](https://chriswhocodes.com/vm-options-explorer.html)
- [hsdis 下载页](https://chriswhocodes.com/hsdis/)
- [JITWatch GitHub](https://github.com/AdoptOpenJDK/jitwatch)
- [JaCoLine](https://jacoline.dev/inspect)
- [JEPMap](https://chriswhocodes.com/jepmap.html)
- [VM Intrinsics Explorer](https://chriswhocodes.com/vm-intrinsics-explorer.html)
- [GC Explorer](https://chriswhocodes.com/gc-explorer.html)
- [《Optimizing Java》(O'Reilly)](https://www.oreilly.com/library/view/optimizing-java/9781492039259/)
- [Chris Newland GitHub](https://github.com/chriswhocodes)
