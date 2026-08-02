# JVM工具解读 · hsdis：让 JIT 说出机器语言

> 工具：hsdis 反汇编插件（chriswhocodes.com/hsdis/）
> 真实地址：https://chriswhocodes.com/hsdis/
> 适用场景：把 JIT 编译产物打印成可读汇编，验证内联、向量化等优化是否真的发生

你开了 `-XX:+PrintAssembly`，结果 JVM 报了一句：`Could not load hsdis-amd64.dll`。HotSpot 不带反汇编器——需要外部插件 hsdis，而 Chris 的下载页就是帮你把这块拼图补齐的地方。

![hsdis 下载页（各平台二进制 + 校验和 + 法律声明）](/images/series/jvm-tools/03-hsdis.png)

## 1.问题背景：JIT 的产出是机器码，但默认「看不了」

HotSpot 的 C2 编译器会把热点方法编译成高度优化的机器码。`-XX:+PrintAssembly` 让 JVM 在编译完成后把汇编打印出来，但反汇编这一步依赖外部库 **hsdis（HotSpot Disassembler）**——GNU binutils `libopcodes` 的薄包装。

JDK 不默认附带（许可 + 分发原因），你得自己下载、放到正确位置。hsdis 不是 Chris 写的，他的贡献是把各平台预编译二进制打包好直接下（Linux/Windows/macOS × x86/ARM），附带 sha256 校验和与法律提示。

## 2.设计理念：托管「找二进制」这件麻烦事

Chris 做的不是造轮子，而是把碎片化的分发问题一站式解决——你不用去翻 OpenJDK 仓库自己编译。

## 3.实际应用：JIT 编译链路里的 hsdis

HotSpot 默认分层编译：先 C1 快速编译，跑热了交 C2 做深度优化。C2 的向量化（SIMD 指令同时算多个数据）和逃逸分析（对象拆成变量省掉分配）的成果，最终都会变成 hsdis 打印的汇编。

![JIT 汇编输出链路](/images/series/jvm-tools/03-jit-pipeline.svg)

编译链路：

1. **解释执行**：先解释跑，收集调用计数
2. **C1 编译**：达到 `Tier3Threshold`（默认 1500 次），C1 快速编译
3. **C2 编译**：达到 `Tier4Threshold`（默认 15000 次）或 OSR 替换，C2 做激进优化——内联展开、向量化、intrinsic 替换、逃逸分析
4. **打印汇编**：`PrintAssembly` 调用 hsdis，把机器码翻译为 mnemonics

### 3.1 下载与放置

在 https://chriswhocodes.com/hsdis/ 选平台+架构下载，命名规则固定为 `hsdis-<arch>.<extension>`：

| 平台 | 架构 | 文件名 |
|------|------|--------|
| Linux | x86_64 | `hsdis-amd64.so` |
| Linux | aarch64 | `hsdis-aarch64.so` |
| macOS | x86_64 / arm64 | `hsdis-amd64.dylib` / `hsdis-aarch64.dylib` |
| Windows | x86_64 | `hsdis-amd64.dll` |

放置路径（按顺序尝试）：`<JDK_HOME>/lib/server/` → `lib/` → 当前目录 → PATH。放好后 `sha256sum` 校验。

### 3.2 让 JIT 打印汇编

```bash
java \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:+PrintAssembly \
  -XX:PrintAssemblyOptions=intel \
  -XX:CompileCommand=print,com/example/Foo.hotMethod \
  -cp yourapp.jar com.example.Main
```

要点：`UnlockDiagnosticVMOptions` 必加，否则 `PrintAssembly` 被忽略；`intel` 语法比 AT&T 更直观；`CompileCommand` 限定范围避免输出爆炸。

### 3.3 典型输出

```asm
0x00007f...: vmovdqu  xmm0,[rdi+0x10]   ; 加载 16 字节
0x00007f...: vpxor    xmm1,xmm1,xmm1   ; 清零
0x00007f...: vpcmpestri xmm1,xmm0,0x1  ; 字符串比较（intrinsic）
```

`v` 前缀 = AVX/SSE 向量指令（SIMD 优化）；`aesenc`/`crc32` = 对应 intrinsic（第八篇）；普通 `mov`/`add` 循环 = JIT 没向量化。

### 3.4 配合 JITWatch

裸看汇编又累又容易漏。下一篇 JITWatch（四）能导入 `PrintAssembly` + `LogCompilation`，做源码/字节码/汇编三栏对照——比肉眼看舒服十倍。

## 4.注意事项

- **法律与安全**：二进制用 OpenJDK（UPL）+ binutils（GPLv3）构建，请自行评估许可兼容性，按不可信代码对待。
- **版本匹配**：架构必须一致（amd64 vs aarch64），通常不强绑 JDK 大版本。加载失败时看 JDK `release` 文件确认 OS/CPU 标识。
- **输出量巨大**：必须用 `CompileCommand=print` 限定范围，或落盘后 JITWatch 离线看。
- **别在生产环境开**：`PrintAssembly` 显著拖慢编译，仅用于诊断。

## 5.与其他工具的关联

| 关联工具 | 关系 |
|---------|------|
| JITWatch（四） | 最强组合：hsdis 翻译机器码，JITWatch 画成源码/字节码/汇编三栏视图 |
| VM Intrinsics Explorer（八） | 互补：Intrinsics 告诉你哪些方法被替换，hsdis 让你亲眼看到替换后的汇编 |
| VM Options Explorer（二） | 同属 diagnostic 等级，都需 `UnlockDiagnosticVMOptions` |
| Byte-Me（六） | 一头一尾：Byte-Me 看 Java→字节码，hsdis 看字节码→汇编 |

## 6.小结

hsdis 让 JIT「说出机器语言」。下一篇 JITWatch（四）把 hsdis 的输出加上 `LogCompilation` 元数据，变成能看懂的图——内联决策、热点方法、字节码↔汇编对照，整合完成。

## 参考链接

- hsdis 下载页（含 sha256、法律声明）：https://chriswhocodes.com/hsdis/
- OpenJDK 仓库（hsdis 源码 + PrintAssembly 实现）：https://github.com/openjdk/jdk
- HotSpot PrintAssembly 文档：https://wiki.openjdk.org/display/HotSpot/PrintAssembly
- JITWatch（hsdis 的可视化搭档）：https://github.com/AdoptOpenJDK/jitwatch
