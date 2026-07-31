# JaCoLine：给你的启动脚本做个体检

> 工具：JaCoLine（jacoline.dev/inspect）
> 适用场景：校验 JVM 启动参数，揪出拼写错误、已废弃与互相冲突的选项

> 真实地址：https://jacoline.dev/inspect
> 适用场景：启动脚本升级 JDK 前，自动检查 `-XX`/`-X` 参数是否拼写错误、已废弃、已过期、相互冲突、版本不兼容

## 0 写在前面

你有没有试过在启动脚本里多打一个字母，比如 `-XX:+UseG1GCX`？JVM **不会报错**，默认行为是悄悄忽略这个不认识的参数（你跑 Java 时敲的那一长串 `java -Xms2g -XX:+UseG1GC ...` 就是启动命令行，里面 `-X`/`-XX` 开头的都是 JVM 的调优开关，成千上万）。然后你的服务跑在「以为开了 G1、其实没开」的状态下，平稳地慢，谁也不知道为什么。更隐蔽的是 `-XX:+AggressiveOpts`——JDK 11 起已废弃、JDK 13 移除，你升级后它直接失效，但脚本还在；或者反过来，新 JDK 上的新参数（比如 `-Xlog:gc*` 统一日志语法）被你拷到了还在用 JDK 8 的环境——直接报 `Unrecognized VM option`（JVM 不认识这个参数时的报错，通常是因为它在新 JDK 被删了或你拼错了）。

JaCoLine（Java Command Line Inspector）就是专门给启动脚本「体检」的工具。它和 VM Options Explorer 是**同源数据、正反两个方向**：Explorer 是「正向查一个参数」，JaCoLine 是「反向校验一整条命令行」。

![JaCoLine 体检流程：命令行 → 对照各 JDK 参数定义 → 分类报告](/images/series/jvm-tools/05-jacoline-flow.svg)

## 1. 真实界面长什么样

打开 https://jacoline.dev/inspect，页面顶部是熟悉的 byte-me.dev 导航条，主区域标题「JaCoLine - Java Command Line Inspector」。

![JaCoLine 主页（Describe your system + 命令文本框 + Inspect 按钮）](/images/series/jvm-tools/05-jacoline.png)

页面结构：

- **顶部 tab**：Inspect（默认，主功能）/ Statistics / API / About / Privacy
- **Describe your system**（系统描述，决定校验基线）：
  - **JDK** 下拉（OpenJDK 8 / 11 / 17 / 21 / Temurin / Corretto / Zulu / Dragonwell 等发行版）
  - **Operating System** 下拉（Linux / Windows / macOS / AIX）
  - **CPU Architecture** 下拉（x86 / aarch64 / ppc / s390 / sparc）
  - **Debug JVM?** 复选框（勾上会启用 `develop` / `notproduct` 级别参数的校验）
- **Enter your Java command line** 文本框（贴整段 `java ...` 命令或只贴参数都行）
- **辅助按钮**：Clear input（清空）、Show example（填入示例）
- **绿色 Inspect Command Line** 按钮：触发校验
- **页脚**：「Created by Chris Newland (@chriswhocodes) | **Data from VM Options Explorer** | Built with Eclipse Jersey and PostgreSQL」——明确告诉你数据来源就是 VM Options Explorer（二）那张表。

## 2. 怎么用：真实操作流程

### 2.1 把启动参数贴进去跑一遍

我把一段真实常见的启动参数贴进去（Xms/Xmx + G1 + 暂停目标 + 字符串去重 + GC 日志 + 文件编码）：

```text
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:+PrintGCDetails -XX:+PrintGCDateStamps
-Xlog:gc*:file=gc.log:time,uptime,level,tags
-Dfile.encoding=UTF-8
```

![粘入真实启动参数，准备跑 Inspect](/images/series/jvm-tools/05b-jacoline-result.png)

结果区会出现分门别类的报告。JaCoLine 实际会按这几类打标签（来自它和 VM Options Explorer 共享的数据模型）：

| 标签 | 含义 | 你该做什么 |
|---|---|---|
| **Unknown / Typo** | JVM 不认识（极可能是拼错） | 删或修正 |
| **Deprecated** | 当前版本已废弃，建议替换 | 计划替换 |
| **Obsolete / Expired** | 当前版本已移除/过期 | 必须删，留着会让新版 JVM 报 `Unrecognized VM option` |
| **Unavailable** | 当前选的 JDK/发行版/CPU 不支持（比如某些 CPU 专属参数） | 检查目标环境 |
| **Duplicate / Conflict** | 同名参数重复或互斥参数同时出现 | 留一个、解冲突 |
| **Availability warning** | 参数是 `diagnostic` / `experimental` 但没加对应 Unlock 开关 | 加 `-XX:+UnlockDiagnosticVMOptions` 或 `-XX:+UnlockExperimentalVMOptions` |

我那段示例里有一个**真实的版本冲突陷阱**：`-XX:+PrintGCDetails` / `-XX:+PrintGCDateStamps` 是 JDK 8 时代的 GC 日志开关，JDK 9 起被统一日志 `-Xlog:gc*` 取代；反过来，`-Xlog:gc*` 语法在 JDK 8 上**根本不存在**。所以这段参数在 OpenJDK8 会报「`-Xlog` unknown」，在 OpenJDK17 会报「`-XX:+PrintGCDetails` deprecated」。JaCoLine 选不同 JDK 跑两遍，结果会反过来——这就是它最大的价值：把跨版本迁移的隐性坑一次扫出来。

### 2.2 升级前的回归体检

计划从 JDK 8 升 17：

1. 把你现有启动脚本里 `java` 之后的整段参数粘进 JaCoLine。
2. 顶部 JDK 下拉切到 OpenJDK 17，点 Inspect。
3. 重点看 **Obsolete / Expired** 和 **Deprecated** 两栏——把它们对应的参数从脚本里删掉或换成推荐替代。
4. 再切到目标发行版（比如 Corretto 17）跑一遍，看是否有发行版特有行为差异。
5. 最后把新参数回写到启动脚本，加注释 + PR。

这整个流程 5 分钟，比人工翻 Release Notes 快一个数量级，也正好是 VM Options Explorer 的 differences 页（二）的「命令行版」。

### 2.3 接入 CI

JaCoLine 页面上有个 **API** tab，背后是一套 REST 接口（用 Eclipse Jersey 暴露，参数和数据库是 PostgreSQL）。它也提供 CLI 工具（jacoline-cli），可以这样集成进流水线：

```bash
jacoline-cli --jdk=OpenJDK17 --os=Linux --cpu=x86 \
  --command="$JAVA_OPTS" \
  --fail-on=obsolete,expired
```

效果：CI 跑构建时，如果启动参数里有在目标 JDK 已 obsolete/expired 的，直接 fail，防止拼写错或过期参数溜进生产。

### 2.4 Statistics tab

看 JaCoLine 自己积累的全网用户提交统计——哪些参数最常被标记 deprecated、最常拼错。挺有意思的「真实世界配置漂移」观察窗。

## 3. 实际应用示例

### 3.1 救了一个「配置看着对但服务慢」的故障

线上服务 P99 突高，监控说 GC 频繁。启动参数看着有 `-XX:+UseG1GC`，但服务实际跑的还是 Parallel GC。运维查启动日志没看到任何错误提示——因为 `-XX:+UseG1GC` 没拼错所以没警告，但参数被某段 shell 转义吞了。JaCoLine 跑一遍（粘进去 + 点 Inspect）→ 报告 `Unknown: -XX:+UseG1GC`（被转义后粘错了）→ 一秒定位。

### 3.2 准备升级 JDK 21

老脚本里这些参数一次性扫：

- `-XX:+UseConcMarkSweepGC` → Obsolete（JDK 14 移除）
- `-XX:MaxPermSize=...` → Obsolete（永久代没了）
- `-XX:+AggressiveOpts` → Expired
- `-XX:+UseStringDeduplication` → 在 G1 下仍可用，但 ZGC 不支持
- `-Xlog:gc*` 语法 → 直接可用（JDK 9+ 标准）

JaCoLine 把这些一次列齐，省半天翻 Release Notes。

## 4. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| VM Options Explorer（二） | **同源数据，反向用法**。页脚明写「Data from VM Options Explorer」。Explorer 适合查「这个参数是做什么的」，JaCoLine 适合查「我这条命令行有没有问题」。升级迁移时：先 Explorer 查新版本的替代参数，再用 JaCoLine 全量校验。 |
| hotspot_option_differences.html | 升级场景的「版本级」对比；JaCoLine 是「命令行级」校验。两者互补，differences 页先扫，JaCoLine 再精校。 |
| Byte-Me（六） | 都属于「让 JVM 黑盒可见」的家族；Byte-Me 看 Java→字节码，JaCoLine 看 JVM 命令行的有效性。 |
| GC Explorer（九） | JaCoLine 报告里有些 `Obsolete` 项涉及 GC（如 CMS）；结合 GC Explorer 确认目标 JDK 的可用 GC 清单，再决定替代方案。 |

## 5. 注意事项

- 数据源是大版本源码快照，可能滞后于最新小版本；报告是「强提示」不是「圣旨」。
- 它分析的是**静态命令行文本**，不感知运行时动态 `-D`（如 Spring Boot 通过 `System.setProperty` 设的）或容器注入的参数——那些得另想办法（如在容器启动入口加 JaCoLine 拦截）。
- 某些厂商私有参数（Dragonwell 的 `-XX:+UseWisp` 之类）JaCoLine 可能不认识，会报 unknown——这种情况结合发行版文档判断，别一概删掉。
- 「拼写正确 + 拼写错的参数同时存在」时，未必能区分哪个是 typo——所有不认识的都标 unknown。

## 6. 小结

JaCoLine 解决「参数写错了发现不了」。但 JVM 还有一层更底层的「看不懂」——你写的 Java，编译后到底变成什么字节码？下一篇 Byte-Me（六）让你在浏览器里亲眼看见这个过程。

## 参考链接

- JaCoLine 主入口：https://jacoline.dev/inspect
- API / CLI 文档：https://jacoline.dev/api（页面内 API tab）
- 同源数据 VM Options Explorer（二）：https://chriswhocodes.com/vm-options-explorer.html
- Chris Newland GitHub（JaCoLine 源码）：https://github.com/chriswhocodes