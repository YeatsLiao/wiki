# JVM工具解读 · hsdis：让 JIT 说出机器语言

> 工具：hsdis 反汇编插件（chriswhocodes.com/hsdis/）
> 适用场景：把 JIT 编译产物打印成可读汇编，验证内联、向量化等优化是否真的发生

> 真实地址：https://chriswhocodes.com/hsdis/
> 适用场景：想把 JIT 编译出的真实汇编代码打印出来，验证内联/向量化/内建函数替换是否生效

你开了 `-XX:+PrintAssembly`，满心期待想看 JIT 生成了什么机器码（CPU 能直接执行的 0/1 指令，你写的 Java 最终要变成它才能跑），结果 JVM 报了一句：`Could not load hsdis-amd64.dll; library not loadable; PrintAssembly is disabled`。怎么回事？因为 HotSpot 自己不带反汇编器——所谓反汇编，就是把机器码翻译成人类能读的汇编文本（`mov`、`add` 这种助记符，和机器码一一对应）；这活儿 HotSpot 不干，它需要一个叫 **hsdis** 的插件，而这个插件得你自己去找、去匹配 JDK 版本与架构。Chris 的 hsdis 下载页（https://chriswhocodes.com/hsdis/），就是帮你把这块拼图补齐的地方。

![hsdis 下载页（各平台二进制 + 校验和 + 法律声明）](/images/series/jvm-tools/03-hsdis.png)

## 1.问题背景：JIT 的产出是机器码，但默认「看不了」

HotSpot 的 C2 编译器会把热点方法编译成高度优化的**机器码**。想窥探它，最硬核的办法是 `-XX:+PrintAssembly`：让 JVM 在每个方法编译完成后，把生成的汇编指令打印出来。

但反汇编这一步需要把机器码翻译成人类可读的汇编文本，这活儿 HotSpot 自己不干——它依赖一个外部动态库 **hsdis（HotSpot Disassembler）**。这个库本质是 GNU binutils 的 `libopcodes` 的一个薄包装，负责把字节流翻译成 mnemonics。JDK 不默认附带它（许可 + 分发原因），所以你得自己下载、放到正确位置。

## 2. 设计理念：把「找二进制」这件麻烦事托管掉

hsdis 本身不是 Chris 写的——它是 OpenJDK 生态的通用组件，源码在 `src/hotspot/cpu/x86/disassembler/` 这类目录下。Chris 的贡献是：**把各平台、各架构的预编译二进制打包好放在一个页面直接下**（Linux/Windows/macOS × x86/ARM），还贴心地给了 sha256 校验和，并附上明确的法律提示。

## 3. JIT 编译链路里的 hsdis 在哪

HotSpot 默认开启「分层编译」：先让 C1（Client 编译器）快速把方法编成机器码让你跑起来，等它跑得够热，再交给 C2（Server 编译器）做深度优化；循环跑到一半也可能被 OSR（栈上替换）直接换成编译好的版本。C2 的优化手段里，向量化（一条 SIMD 指令同时算多个数据，汇编里 `v` 开头的 AVX/SSE 指令就是干这个的）和逃逸分析（发现对象「逃不出方法」就拆成普通变量直接用，省掉分配开销）是关键——而它们的成果，最终都会变成 hsdis 能打印出来的汇编。

![JIT 汇编输出链路](/images/series/jvm-tools/03-jit-pipeline.svg)

关键节点：

1. **解释执行**：方法先解释跑，收集调用计数（invocation counter + backedge counter）。
2. **C1 编译**：达到 `Tier3Threshold`（默认 1500 次调用）后，C1（Client Compiler）把它编译成机器码。
3. **C2 编译**：方法继续被调用，达到 `Tier4Threshold`（默认 15000 次）或被 OSR 替换，C2（Server Compiler）做激进优化——内联展开、循环展开、向量化、intrinsic 替换、逃逸分析后的标量替换等。
4. **打印汇编**：`PrintAssembly` 在编译完成后调用 hsdis，把生成的机器码翻译成 mnemonics 输出。

## 4. 怎么用：真实操作流程

### 4.1 下载与放置

在 https://chriswhocodes.com/hsdis/ 选对你的平台 + 架构，下载对应的二进制。命名规则固定为 `hsdis-<arch>.<extension>`（这点很关键，HotSpot 只认这个命名）：

| 平台 | 架构 | 文件名 |
|---|---|---|
| Linux | x86_64 | `hsdis-amd64.so` |
| Linux | aarch64 | `hsdis-aarch64.so` |
| macOS | x86_64 / arm64 | `hsdis-amd64.dylib` / `hsdis-aarch64.dylib` |
| Windows | x86_64 | `hsdis-amd64.dll` |

放到 JDK 寻找的路径（顺序依次尝试）：

```text
<JDK_HOME>/lib/server/hsdis-<arch>.<ext>
<JDK_HOME>/lib/hsdis-<arch>.<ext>
当前工作目录
PATH 里的目录
```

放好之后用 `sha256sum` 校验一下，对照页面给的校验和。

### 4.2 让 JIT 打印汇编

最常见的组合：

```bash
java \
  -XX:+UnlockDiagnosticVMOptions \
  -XX:+PrintAssembly \
  -XX:PrintAssemblyOptions=intel \
  -XX:CompileCommand=print,com/example/Foo.hotMethod \
  -cp yourapp.jar com.example.Main
```

要点：

- `+UnlockDiagnosticVMOptions` 必加，否则 `PrintAssembly` 被默默忽略。
- `PrintAssemblyOptions=intel` 输出 **Intel 语法**（`mov eax, ebx`），默认是 **AT&T 语法**（`movl %ebx, %eax`），多数人 Intel 看着更顺。
- `CompileCommand=print,ClassName.methodName` **限定打印范围**——否则所有编译过的方法都会吐，输出量爆炸。

### 4.3 典型输出长什么样

打开示例后，你会看到类似：

```asm
0x00007f...: vmovdqu  xmm0,[rdi+0x10]   ; 加载 16 字节
0x00007f...: vpxor    xmm1,xmm1,xmm1   ; 清零
0x00007f...: vpcmpestri xmm1,xmm0,0x1  ; 字符串比较（intrinsic）
```

`v` 前缀是 AVX/SSE 向量指令。看到这些，就知道 JIT 做了 SIMD 优化。看到 `aesenc`/`aesdec` 就是 AES intrinsic（八）；看到 `crc32` 指令就是 CRC32 intrinsic。看到普通 `mov`/`add` 循环说明 JIT 没向量化——可能因为数据依赖让向量化不划算。

### 4.4 配合 JITWatch

裸看汇编又累又容易漏。下一篇要讲的 JITWatch（四）能直接把 `PrintAssembly` + `LogCompilation` 的输出导入，做源码 / 字节码 / 汇编三栏对照，还能在汇编上标注内联来源——比肉眼看舒服十倍。

## 5. 注意事项

- **法律与安全**：页面明确写了，二进制用 OpenJDK（UPL）+ binutils（GPLv3）源码构建，作者认为组合产物兼容两种许可，但**请你自己做评估**，按「不可信代码」对待（生产环境只用来分析，别让 JVM 强依赖它）。
- **版本匹配**：hsdis 与你的 JDK **架构**必须一致（amd64 vs aarch64），但通常**不**强绑 JDK 大版本（同一架构下通用）；跨大版本若加载失败，看 JDK 的 `release` 文件确认 OS/CPU 标识。
- **输出量巨大**：裸 `PrintAssembly` 会让控制台被刷屏，必须用 `CompileCommand=print` 限定范围，或配合 `-XX:+LogCompilation` 落盘后用 JITWatch 离线看。
- **别在生产环境开**：`PrintAssembly` 本身会显著拖慢编译，只用于诊断。

## 6. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| JITWatch（四） | **最强组合**。hsdis 负责把机器码翻译成 mnemonics，JITWatch 负责把这些 mnemonics 画成可读视图（源码/字节码/汇编三栏、inline 标注、热点提示）。没有 hsdis，JITWatch 的右栏是空的。 |
| VM Intrinsics Explorer（八） | 互补。Intrinsics Explorer 告诉你「哪些方法被替换」（如 `Math.sin`、`AES`、`StringLatin1.indexOf`），hsdis 让你**亲眼看到**替换后的汇编（`fsin`、AES-NI 指令、`vpcmpestri`）。 |
| VM Options Explorer（二） | 都需要 `-XX:+UnlockDiagnosticVMOptions` 才能用——同属 diagnostic 等级的能力。 |
| Byte-Me（六） | 一头一尾。Byte-Me 看 Java→字节码（编译期产物），hsdis 看字节码→汇编（运行期 JIT 产物）。 |

## 7. 小结

hsdis 让 JIT「说出机器语言」，但它吐出的是原始日志。下一篇 JITWatch（四），就是把 hsdis 的输出加上 `LogCompilation` 的元数据，变成能看懂的图——内联决策、热点方法、字节码↔汇编对照，整合完成。

## 参考链接

- hsdis 下载页（含 sha256、法律声明、二进制列表）：https://chriswhocodes.com/hsdis/
- OpenJDK 仓库（hsdis 源码 + PrintAssembly 实现）：https://github.com/openjdk/jdk
- JITWiki / HotSpot PrintAssembly 文档：https://wiki.openjdk.org/display/HotSpot/PrintAssembly
- JITWatch（hsdis 的可视化搭档）：https://github.com/AdoptOpenJDK/jitwatch