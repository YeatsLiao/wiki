# JVM工具解读 · JaCoLine：给你的启动脚本做个体检

> 工具：JaCoLine（jacoline.dev/inspect）
> 真实地址：https://jacoline.dev/inspect
> 适用场景：校验 JVM 启动参数，揪出拼写错误、已废弃与互相冲突的选项

你有没有试过在启动脚本里多打一个字母，比如 `-XX:+UseG1GCX`？JVM **不会报错**，默默忽略。然后你的服务跑在「以为开了 G1、其实没开」的状态下，平稳地慢，谁也不知道为什么。

更隐蔽的是废弃参数：`-XX:+AggressiveOpts` 在 JDK 11 废弃、JDK 13 移除，升级后脚本还在但参数已失效。反过来新参数拷到旧 JDK 直接报 `Unrecognized VM option`。

JaCoLine（Java Command Line Inspector）就是专门给启动脚本体检的工具——贴一段命令行，它对照各 JDK 版本的参数定义逐条校验。和 VM Options Explorer（第二篇）同源数据，方向相反。

![JaCoLine 体检流程：命令行 → 对照各 JDK 参数定义 → 分类报告](/images/series/jvm-tools/05-jacoline-flow.svg)

## 1.问题背景：真实界面

打开 https://jacoline.dev/inspect，主区域标题「JaCoLine - Java Command Line Inspector」。

![JaCoLine 主页](/images/series/jvm-tools/05-jacoline.png)

页面结构：顶部 Inspect / Statistics / API / About / Privacy tab；Describe your system（JDK 发行版 / OS / CPU 架构 / Debug JVM）；命令文本框 + 绿色 Inspect 按钮；页脚标注数据来自 VM Options Explorer。

## 2.实际应用：怎么用

### 2.1 把启动参数贴进去跑一遍

```text
-Xms2g -Xmx4g
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:+UseStringDeduplication
-XX:+PrintGCDetails -XX:+PrintGCDateStamps
-Xlog:gc*:file=gc.log:time,uptime,level,tags
-Dfile.encoding=UTF-8
```

![粘入真实启动参数](/images/series/jvm-tools/05b-jacoline-result.png)

JaCoLine 按这几类打标签（共享 VM Options Explorer 的数据模型）：

| 标签 | 含义 | 你该做什么 |
|------|------|----------|
| Unknown / Typo | JVM 不认识（极可能拼错） | 删或修正 |
| Deprecated | 当前版本已废弃 | 计划替换 |
| Obsolete / Expired | 已移除/过期 | 必须删，留着会让新版 JVM 报错 |
| Unavailable | 当前 JDK/发行版/CPU 不支持 | 检查目标环境 |
| Duplicate / Conflict | 同名重复或互斥 | 留一个、解冲突 |
| Availability warning | diagnostic/experimental 但缺 Unlock 开关 | 加对应 Unlock |

示例里的版本冲突陷阱：`-XX:+PrintGCDetails` 是 JDK 8 的 GC 日志开关，JDK 9 起被 `-Xlog:gc*` 取代；反过来 `-Xlog:gc*` 在 JDK 8 上不存在。JaCoLine 选不同 JDK 跑两遍，结果会反过来——这就是它最大价值：把跨版本迁移的隐性坑一次扫出来。

### 2.2 升级前的回归体检

从 JDK 8 升 17，流程 5 分钟：

1. 把启动脚本里 `java` 之后的整段参数粘进 JaCoLine
2. JDK 下拉切到 OpenJDK 17，点 Inspect
3. 重点看 Obsolete / Expired 和 Deprecated——删掉或换成推荐替代
4. 切到目标发行版（如 Corretto 17）再跑一遍
5. 新参数回写脚本，加注释 + PR

### 2.3 接入 CI

JaCoLine 提供 CLI 工具（jacoline-cli），可集成进流水线：

```bash
jacoline-cli --jdk=OpenJDK17 --os=Linux --cpu=x86 \
  --command="$JAVA_OPTS" \
  --fail-on=obsolete,expired
```

CI 跑构建时发现过期参数直接 fail，防止拼写错或过期参数溜进生产。

### 2.4 真实案例

**案例一**：线上 P99 突高，监控说 GC 频繁。参数有 `-XX:+UseG1GC` 但实际跑的是 Parallel GC——参数被某段 shell 转义吞了，JVM 没报错。JaCoLine 跑一遍一秒定位。

**案例二**：准备升 JDK 21，老脚本里 `-XX:+UseConcMarkSweepGC`（JDK 14 移除）、`-XX:MaxPermSize`（永久代没了）、`-XX:+AggressiveOpts`（已过期）一次性扫出，省半天翻 Release Notes。

## 3.与其他工具的关联

| 关联工具 | 关系 |
|---------|------|
| VM Options Explorer（二） | 同源数据反向用法：Explorer 查参数，JaCoLine 校验命令行 |
| hotspot_option_differences | 版本级对比 + 命令行级精校，升级场景互补 |
| GC Explorer（九） | JaCoLine 报告的 Obsolete 项涉及 GC 时，用 GC Explorer 确认替代方案 |
| Byte-Me（六） | 同属"让 JVM 内部机制可见"家族：Byte-Me 看字节码，JaCoLine 看命令行 |

## 4.注意事项

- 数据源是大版本源码快照，可能滞后于最新小版本；报告是强提示不是圣旨
- 只分析静态命令行文本，不感知运行时 `System.setProperty` 或容器注入的参数
- 某些厂商私有参数（如 Dragonwell 的 `-XX:+UseWisp`）会报 unknown——结合发行版文档判断
- 拼写正确 + 拼写错的参数同时存在时，未必能区分哪个是 typo

## 5.小结

JaCoLine 解决「参数写错了发现不了」的问题。但 JVM 还有一层更底层的「看不懂」——你写的 Java 编译后到底变成什么字节码？下一篇 Byte-Me（六）让你在浏览器里亲眼看见这个过程。

## 参考链接

- JaCoLine 主入口：https://jacoline.dev/inspect
- API / CLI 文档：https://jacoline.dev/api
- 同源数据 VM Options Explorer：https://chriswhocodes.com/vm-options-explorer.html
- Chris Newland GitHub（JaCoLine 源码）：https://github.com/chriswhocodes
