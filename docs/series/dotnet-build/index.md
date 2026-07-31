# .NET构建机制剖析 · 系列导览

> 技术栈：.NET + MSBuild + Visual Studio + C# 编译器
> 适用场景：当你遇到"改了配置却不生效""清理了目录还在""Debug 正常 Release 崩溃"这类构建系统的诡异行为时，本系列帮你把 Visual Studio 构建这只黑盒拆开看清楚。

大多数 .NET 开发者依赖 IDE 的"生成"按钮完成日常工作，构建系统平时透明可靠，可一旦出问题就令人摸不着头脑：修改了 `app.config` 程序读的还是旧值、"清理解决方案"后 `bin`/`obj` 瞬间又重新出现、同一份代码 Debug 好好的换 Release 就出错。

本系列源于一次真实的 WPF 项目构建排查，从构建配置的本质讲起，依次拆解增量构建的判定规则、Design-Time Build 的后台机制、构建产物与清理的完整逻辑，每篇都给出可落地的工程化方案。

## 阅读路径

| 序号 | 文章 | 核心问题 |
|:---|:---|:---|
| 一 | [Debug与Release的本质差异](./01-Debug与Release的本质差异.md) | 两套配置在编译期、编码期、运行期究竟差在哪？Release 还能调试吗？ |
| 二 | [配置文件增量构建原理](./02-配置文件增量构建原理.md) | 为什么改了 app.config 却不生效？增量构建怎么判定该不该重新构建？ |
| 三 | [Design-Time Build解析](./03-DesignTimeBuild解析.md) | 清理后 bin/obj 为什么瞬间"复活"？IDE 后台在偷偷构建什么？ |
| 四 | [构建产物与清理机制](./04-构建产物与清理机制.md) | Build/Rebuild/Clean 到底做了什么？怎样实现真正彻底的清理？ |

## 参考链接

- [MSBuild 官方文档](https://learn.microsoft.com/visualstudio/msbuild/msbuild)
- [MSBuild Targets](https://learn.microsoft.com/visualstudio/msbuild/msbuild-targets)
- [C# 编译器选项：Optimize](https://learn.microsoft.com/dotnet/csharp/language-reference/compiler-options/code-generation)
