# JVM工具解读 · Byte-Me：在浏览器里看 Java 怎么变成字节码

> 工具：Byte-Me（byte-me.dev）
> 真实地址：https://byte-me.dev/
> 示例库：https://byte-me.dev/load/{ExampleName}
> 适用场景：在浏览器里即时查看 Java 源码编译出的字节码，理解语法糖的真实实现

想知道 `switch` 表达式（JEP 361，JDK 14 落地）编译成什么字节码？传统做法三步：写 `.java` → `javac` 编译 → `javap -c` 反编译。还得切 JDK、配环境。

Byte-Me 把这些塞进一个网页：左边写 Java，右边实时出字节码，顶端切目标 JDK（21/22/23，还能开关 preview 等级）。preview 是还没正式定稿、需要显式开启的新语法。

打开 `https://byte-me.dev/load/SwitchExpressions` 的真实截图——左边源码区加载了 SwitchExpressions 类（含 `lookupSwitch`、`tableSwitch`、`switchExpression` 三个方法），Source/Target 设 14：

![Byte-Me 加载 SwitchExpressions 示例（左侧源码，右侧 Examples 导航）](/images/series/jvm-tools/01-byte-me-switchexpr.png)

## 1.问题背景：看字节码的传统链路太重

字节码是 JVM 的「汇编」，理解它才能真懂 Java 的很多行为：

- 为什么 `String` 拼接在某些情况变 `StringBuilder`（JDK 9+ 进一步变成 `invokedynamic makeConcatWithConstants`）
- 为什么 `switch` 有时用 `tableswitch` 有时 `lookupswitch`（case 紧排 → table，稀疏 → lookup）
- 为什么 `int` 独有 `iinc` 自增指令（其他类型要 load/add/store 四五条）
- 为什么 lambda 编译出来是一堆 `invokedynamic` + `LambdaMetafactory`

传统链路：

```bash
javac Foo.java
javap -c -p Foo.class
```

你得有 JDK、懂 `javap` 输出、还得自己写示例代码。想对比「JDK 8 vs JDK 21 编译同一段代码差异」，更是要装多套 JDK。

## 2. 设计理念：浏览器里的「源码 → 字节码」实时映射

![Byte-Me 工作模型：左侧写 Java 源码，右侧实时出字节码，顶部切 JDK 版本](/images/series/jvm-tools/06-byteme-model.svg)

Byte-Me 把编译搬到了服务端（或 WASM），你在网页里写源码，它返回对应的字节码，左右两栏并列。核心能力：

- **目标 JDK 切换**：顶部 Source / Target 下拉（JDK 8 到最新，支持 preview），同一段代码、不同版本编译结果并排看。
- **示例库**：内置几十个示例（每条对应一个 JEP 或语言特性），等于把《Java 语言规范》的演进变成了可运行的字节码对照表。
- **可编辑**：源码可直接改 → 点 Compile → 看新字节码，验证你的直觉。
- **Load Source / Upload Class**：除了写源码，也能上传 `.class` 文件反编译（javap 等价能力）。

## 3. 真实示例库与对应 JEP

从 byte-me.dev 抓的真实示例清单（每条都对应一个 Java 演进里程碑）：

| 示例 | 对应 JEP / JDK | 看什么 |
|---|---|---|
| `SwitchExpressions` | JEP 361 / JDK 14 | switch 表达式如何变成 tableswitch + 返回值模式 |
| `SealedAnimal` | JEP 409 / JDK 18 | 密封类编译产物（PermittedSubclasses 属性） |
| `PersonRecord` | JEP 395 / JDK 16 | record 自动生成的 equals/hashCode/toString |
| `PrimitiveSwitchExpressions` | JEP 455 / JDK 23 | switch 表达式在 primitive 上的演进 |
| `StatementsBeforeSuper` | JEP 447 / JDK 22 | super() 之前写语句的编译产物 |
| `StringTemplate` | JEP 430 / JDK 21 | 字符串模板的预览语法 |
| `TextBlocks` | JEP 378 / JDK 15 | 文本块编译产物 |
| `NoClass` | JEP 463 / JDK 21 | 隐式声明的类和实例 main |
| `VarKeyword` | JEP 286 / JDK 10 | var 类型推断 |
| `CallPrivateMethod` | JEP 181 | Java 11 起嵌套类私有方法改用 invokevirtual |
| `TryWithResources` | JDK 7 | try-with-resources 在 success / exception 两条路径上的 close() 调用 |
| `Increment` | — | 揭示只有 `int` 有 `iinc` 单指令自增 |
| `Loopy` | — | for / while / do-while / enhanced-for 各编译成什么样 |
| `Erasure` / `Generics` | — | 泛型擦除 + Signature 属性 |
| `DeadCode` | — | static final 守卫的死代码消除 |
| `ConstantOptimisation` | — | javac 对常量的简单运算折叠 |

## 4. 怎么用：真实操作流程

### 4.1 加载一个示例看字节码

1. 直接访问 `https://byte-me.dev/load/SwitchExpressions`（或从主页 Examples 表点进去）。
2. 左侧源码区出现 SwitchExpressions 类的 Java 源，顶部 Source/Target 下拉默认成对应版本（JEP 361 是 JDK 14，所以默认 14）。
3. 点 **Compile**，下方（或右侧）出现字节码面板——通常包含常量池、方法体（带行号映射）、局部变量表。
4. 字节码里关键看点：
   - `tableswitch` vs `lookupswitch` 的选择
   - `lookupswitch` 例子注释里明写 `// sparse case values result in a lookupswitch`
   - `tableSwitch` 例子注释里明写 `// tightly packed case values result in a tableswitch`
   - switch 表达式返回值的处理（一个临时变量 + 多个 case 块写入）

### 4.2 对比不同 JDK 版本

把 Target 下拉从 14 改成 13（或更早），点 Compile——同一段 switch 表达式在 JDK 13 上会编译失败（因为 JEP 361 是 JDK 14 才引入的特性）。这是看「一个特性在哪一版本落地」最直观的方式。

### 4.3 验证你自己的写法

怀疑「`i++` 和 `++i` 字节码一样吗？」直接在 Edit Source 里改 Increment 示例的代码，或写自己的两行循环，对比字节码。怀疑「`String + String` 什么时候会变 StringBuilder？」写几行不同情境的字符串拼接看字节码（JDK 9+ 通常直接 invokedynamic 到 `makeConcatWithConstants`，不再走 StringBuilder）。

### 4.4 上传 .class 反编译

点 **Upload Class** 按钮，上传你本地编译好的 `.class` 文件——Byte-Me 会显示对应的字节码，等价于本地跑 `javap -c -p`，但不用命令行。

## 5. 实际应用示例

### 5.1 验证「密封类是真密封还是编译期擦除」

加载 `SealedAnimal`，看字节码里的 `PermittedSubclasses` 属性——密封约束写在 class 文件的 attributes 区，JVM 在 `linkClasses` / `verification` 时会校验。这不是 javac 阶段的表面活，是真有运行时防线。

### 5.2 看 lambda 的真实面目

写一段 lambda 代码，点 Compile。字节码里可以看到：

```text
invokedynamic #2,  0  // InvokeDynamic #2:LambdaMetafactory(...)
```

这行才是 lambda 的真身——`LambdaMetafactory` 在运行时生成一个实现函数式接口的类。理解这点，你就理解了「为什么 lambda 捕获的局部变量必须是 effectively final」「为什么 lambda 在冷启动时有一波生成开销」。

### 5.3 看 `String.format` vs `String + String` 的本质差异

写两种字符串拼接，对比字节码：可以看到 `+` 在 JDK 9+ 走 `invokedynamic makeConcatWithConstants`（一条指令完成），而 `String.format` 会触发对 `Formatter` 的方法调用链。这就是为什么热循环里 `+` 拼接远比 `String.format` 快的底层原因。

## 6. 与其它工具的关联

| 关联工具 | 关系 |
|---|---|
| JEP 三件套（七） | **强关联**。Byte-Me 的每个示例都标注了对应 JEP 编号和引入版本，是「JEP 落地后的字节码实证」。先在 JEPMap 看到一个特性，再用 Byte-Me 看它的字节码长什么样。 |
| JITWatch（四） / hsdis（三） | 一头一尾。Byte-Me 看 javac 编译产物（运行前），JITWatch + hsdis 看 JIT 编译产物（运行后）。同一段代码，两层编译分别长什么样，对照看才能理解全貌。 |
| VM Options Explorer（二） | Byte-Me 帮你理解 class 文件结构，VM Options Explorer 帮你理解 class 加载进 JVM 后那些 `-XX` 参数对运行时的影响。 |
| VM Intrinsics Explorer（八） | bytecode 层看不见 intrinsic 替换——intrinsic 是 JIT 阶段的优化，Byte-Me 只到 javac 为止。 |

## 7. 注意事项

- 代码在远端编译，**别粘敏感 / 私有代码**进去。
- preview 特性需显式勾选 `--enable-preview level`，否则新语法编不过。
- Byte-Me 展示的是「单文件 javac 产物」，不含 JVM 运行期优化（JIT 那层是 JITWatch 的事），两层别混淆。
- 不同 JDK 的 `javac` 对同一特性的编译产物可能微调（比如 sealed classes 的属性名），别只看一个版本就下结论。

## 8. 小结

Byte-Me 让你看见「Java → 字节码」。但字节码之上还有一层——JVM 的演进路线图本身。下一篇 JEP 三件套（七），帮你把「Java 每个版本加了什么」也变成可检索的东西。

## 参考链接

- Byte-Me 主站：https://byte-me.dev/
- 示例索引（GitHub）：https://github.com/chriswhocodes/byte-me-examples
- OpenJDK JEP 索引：https://openjdk.org/jeps
- 字节码指令参考（JVMS）：https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html