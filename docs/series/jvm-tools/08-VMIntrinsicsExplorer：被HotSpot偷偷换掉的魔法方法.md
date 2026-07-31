# VM Intrinsics Explorer：被 HotSpot 偷偷换掉的魔法方法

> 工具：VM Intrinsics Explorer（chriswhocodes.com/vm-intrinsics-explorer.html）
> 适用场景：查询哪些标准库方法会被 HotSpot 替换成内建实现，理解「为什么这段代码这么快」

> 真实地址：https://chriswhocodes.com/vm-intrinsics-explorer.html
> 数据源：OpenJDK 源码 `src/hotspot/share/classfile/vmIntrinsics.hpp`
> 适用场景：理解「为什么某些 Java 方法能这么快」，或排查 intrinsic 替换导致的诡异行为

`Math.addExact`、`Arrays.equals`、`StringLatin1.indexOf`、`AES.encrypt`、`Unsafe.allocateInstance`——这些方法看着平平无奇，跑起来却快得不像 Java。秘密是：HotSpot 在运行时**根本没执行你看到的字节码**（你写的 Java 编译后产生的中间代码，JVM 能懂但不直接跑在 CPU 上），而是把它们替换成了手写汇编（或特殊编译器 IR）——这种「被偷偷换掉」的标准库方法，在 HotSpot 里有个专有名词叫 intrinsic（内建函数）。VM Intrinsics Explorer 就是把这份「被偷偷换掉的方法清单」摊开给你看。

打开真实页面 https://chriswhocodes.com/vm-intrinsics-explorer.html：

![VM Intrinsics Explorer：vmIntrinsics.hpp 注释、Flags 说明、版本切换、典型条目](/images/series/jvm-tools/08-intrinsics.png)

页面顶部就是 OpenJDK 源码 `share/classfile/vmIntrinsics.hpp` 里那段经典注释（直接读源码的快照）：

```cpp
// There are two types of intrinsic methods:
// (1) Library intrinsics and (2) bytecode intrinsics.
//
// (1) A library intrinsic method may be replaced with hand-crafted
//     assembly code, with hand-crafted compiler IR, or with
//     a combination of the two. The semantics of the replacement
//     code may differ from the semantics of the replaced code.
//
// (2) Bytecode intrinsic methods are not replaced by special code,
//     but they are treated in some other special way by the compiler.
//     For example, the compiler may delay inlining for some
//     String-related intrinsic methods.
```

右上角是 **Flags 说明**（F_R / F_S / F_Y / F_RN / F_SN / F_RNY），描述每个 intrinsic 方法的形态（普通 / 静态 / 同步 / native）。中间一排是 JDK 版本切换链接（6~27），底部是搜索框 + 完整 intrinsic 表格。

## 1. 两种 intrinsic 的本质区别

![VM Intrinsics 替换机制：你以为执行的字节码 vs 实际执行的手写汇编](/images/series/jvm-tools/08-intrinsic-replace.svg)

| 类型 | 替换方式 | 语义差异风险 |
|---|---|---|
| **Library intrinsic** | 整段替换成手写汇编 / C2 IR / 两者结合 | **可能与原方法语义不一致**（注释明说） |
| **Bytecode intrinsic** | 不替换字节码，但编译器特殊对待（如延迟内联） | 一般语义一致 |

这张表来自 HotSpot 源码本身的注释，Chris 没加工——这是理解 intrinsic 最权威的源头。

## 2. 表格里每条记录的字段

| 字段 | 含义 |
|---|---|
| Id | intrinsic 在 HotSpot 内部的 enum 名称（以前缀 `_` 开头，如 `_arraycopy`、`_aescrypt_encryptBlock`） |
| Since | 从哪个 JDK 版本引入 |
| Class | 声明该方法的 Java 类（含包名，如 `com.sun.crypto.provider.AESCrypt`） |
| Name | 方法名（如 `addExact`、`implEncryptBlock`） |
| Signature | 方法描述符（如 `(II)I`、`([B[BI[B)V`） |
| Type | Library 或 Bytecode |

截图里能看到几条非常典型的：

- `_addExactI` — `java.lang.Math.addExact(int, int)` → 编译成 `add` + `jo` 指令（带溢出检查）
- `_aescrypt_encryptBlock` — `com.sun.crypto.provider.AESCrypt.implEncryptBlock` → 替换成 **AES-NI 指令**（`aesenc`/`aesdec`），硬件加速
- `_allocateInstance` — `jdk.internal.misc.Unsafe.allocateInstance` → 直接绕过构造器分配
- `_arraycopy` — `java.lang.System.arraycopy` → JIT 已知最优实现，可能用 `movdqu`/`rep movsb` 等
- `_base64_encodeBlock` — `java.util.Base64$Encoder.encodeBlock` → 查表 + 向量化
- `_bitCount_I` — `java.lang.Integer.bitCount` → 替换成 `popcnt` 指令

## 3. 怎么用：真实操作流程

### 3.1 查一个方法是不是 intrinsic

1. 在搜索框输入类名或方法名关键字：`Math` / `Arrays` / `AES` / `StringLatin1` / `Unsafe`。
2. 表格实时过滤。
3. 看 Type 列：标 `Library` 的是被换掉的；标 `Bytecode` 的是编译器特殊对待。

常见 hot path intrinsic 一览：

| 类 | 典型 intrinsic |
|---|---|
| `java.lang.Math` | `addExact`、`multiplyExact`、`floor`、`ceil`（JDK 11+）、`*F` 浮点版 |
| `java.lang.System` | `arraycopy`（最经典之一） |
| `java.util.Arrays` | `equals` 系列（int/long/float/double/object） |
| `java.lang.Integer` / `Long` | `bitCount`、`numberOfLeadingZeros`、`highestOneBit` |
| `java.lang.String` / `StringLatin1` / `StringUTF16` | `indexOf`、`equals`、`compareTo` |
| `java.lang.Object` | `hashCode`（CDSv1 在特定情况下） |
| `com.sun.crypto.provider.AESCrypt` | `implEncryptBlock` / `implDecryptBlock`（用 AES-NI） |
| `sun.security.provider.MD5` / `SHA` | 摘要算法的轮函数 |
| `java.util.zip.CRC32` | `update` → `crc32` 指令 |
| `jdk.internal.misc.Unsafe` | `allocateInstance`、`copyMemory`、`getXxx` / `putXxx` |

### 3.2 跨版本对比

顶部那排 **JDK6 / JDK7 / JDK8 ... JDK27** 链接，每个版本是独立的 intrinsic 视图。JDK 8 → JDK 11 期间 `Math.*Exact` 系列大量加入；JDK 11 → JDK 17 期间 Vector API 引入大量 SIMD intrinsic；JDK 21 之后 Panama / Foreign Function 触发一批新 intrinsic。对比下来能直观看到 HotSpot 的优化演进方向。

### 3.3 调试诡异行为

某些 Library intrinsic 的替换语义与原方法**略有差异**（注释明说 `semantics may differ`）。遇到极难复现、只在特定方法上出现的边界问题时，可怀疑 intrinsic，并用对应开关临时禁用做对照：

```bash
java -XX:+UnlockDiagnosticVMOptions \
     -XX:DisableIntrinsic=::_arraycopy \
     -jar yourapp.jar
```

`DisableIntrinsic=<id>` 格式（`::` + intrinsic Id），可写多个对照实验。这是定位「是不是 intrinsic 替换出问题」的终极手段。

### 3.4 理解「写热点代码该用谁」

`Integer.bitCount(int)` 被 intrinsify 成 `popcnt`——所以比手写循环快得多。写热路径时优先用这些「被内建」的标准库方法，而非自己造轮子：JIT 会给你免费加速。

## 4. 实际应用示例

### 4.1 排查「AES 加密为什么 GPU 加速不了」

业务想用 GPU 加速 AES 加密，但 `com.sun.crypto.provider.AESCrypt.implEncryptBlock` 已经是 intrinsic 了——JVM 直接换成 CPU 的 **AES-NI 指令集**（`aesenc`/`aesdec`），根本走不到你期待的 GPU 代码路径。明白这点，就知道要走 GPU 必须换用非 HotSpot intrinsic 的实现（如 BouncyCastle 的纯 Java 版本）。

### 4.2 验证 Vector API 是否真的快了

JDK 17+ 的 Vector API（JEP 338/414/439/448）底层靠一大堆新加的 SIMD intrinsic 支撑。打开 VM Intrinsics Explorer 切到 JDK 17，搜 `Vector` 或 `vmul`/`vadd` 这类向量操作，能看到对应条目。说明 HotSpot 确实把你的 `VectorSpecies` 操作编译成 `vpxor`/`vpaddd` 等 AVX 指令。

### 4.3 排查 `Math.fma` 行为异常

`Math.fma(a, b, c)`（JDK 21+ 引入 JEP 318 之前的设计）——查 Intrinsics Explorer 看它是 Library 还是 Bytecode，决定能否用 `-XX:DisableIntrinsic` 排查。

## 5. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| hsdis（三） | **可视化搭档**。Intrinsics Explorer 告诉你「哪些方法被替换」，hsdis 让你**亲眼看到**替换后的汇编（`aesenc`、`vpcmpestri`、`popcnt`）。 |
| JITWatch（四） | LogCompilation XML 里的 `<intrinsic>` 节点 ID 就是这张表里的 Id。JITWatch 把 intrinsic 高亮成「⚡」标记，源头就是 vmIntrinsics.hpp。 |
| VM Options Explorer（二） | 部分 intrinsic 替换行为可通过 `-XX:-InlineIntrinsics` 或 `-XX:DisableIntrinsic=...` 控制，参数定义在 globals.hpp。 |
| JEP 三件套（七） | 新 intrinsic 往往随 JEP 引入（Vector API、Foreign Function API、ScopedValue 等都带来一批新 intrinsic）。 |
| Byte-Me（六） | 一头一尾。Byte-Me 看 Java→字节码（intrinsic 这层还没动），Intrinsics Explorer 看字节码→汇编时被替换的环节。 |

## 6. 注意事项

- 列表随 JDK 版本增长，页面默认显示 OpenJDK 11，更高版本是独立视图；新版本可能新增 / 调整。
- `diagnostic` / `experimental` 级别的 intrinsic 控制开关需解锁，生产慎用。
- 不同 CPU 架构支持的 intrinsic 不同（某些向量化 intrinsic 只在 x86 AVX 或 ARM SVE 上生效），跨平台性能表现可能不一致。
- Library intrinsic 的替换语义与原方法**可能不同**（注释明说），别假设 100% 等价。

## 7. 小结

Intrinsics Explorer 揭开了「为什么标准库方法这么快」。但 JVM 还有另一个大决策点——**垃圾回收器选哪个**。下一篇 GC Explorer（九）把各 JDK / 各发行版的 GC 可用性摊成一张矩阵。

## 参考链接

- VM Intrinsics Explorer：https://chriswhocodes.com/vm-intrinsics-explorer.html
- OpenJDK 源码 vmIntrinsics.hpp：https://github.com/openjdk/jdk/blob/master/src/hotspot/share/classfile/vmIntrinsics.hpp
- OpenJDK HotSpot Intrinsics 文档：https://wiki.openjdk.org/display/HotSpot/Intrinsics
- AES-NI 指令集（被 intrinsic 替换的硬件加速）：https://en.wikipedia.org/wiki/AES_instruction_set