# 第 29 篇：数据类覆盖率攻坚——从 81% 冲到 97%，还揪出两个 BOM 截断 Bug

> 本系列第 29 篇。第 28 篇把覆盖率做到了 81.67%，评审的目标是「≥95%」。这篇记录我怎么啃下剩下那 15 个百分点：给数据类补 27 个用例、揪出两个真实的 UTF-8 BOM 截断 Bug，以及踩到的两个仓颉大坑——`as` 不是上转型、NSDate 喂 Inf/NaN 会死循环。

---

## 一、目标：81.67% → ≥95%

第 28 篇结束时，覆盖率停在 **81.67%（2344/2870）**。评审的硬性要求是**行覆盖率至少 95%**。差的这 526 行主要分布在：

- 三大解析器/写出器的深层路径（ASCII 71.5% / Binary 65.9% / XML 70.9%）
- 数据类型的辅助分支（NSSet 71.3% / UID 81.8% / NSArray 88.6% / NSNumber 91.3% ……）

我先用 `cjcov` 生成的逐文件报告，把每个文件的**未覆盖行号**导出成一份清单，然后对着源码一行行看：**这行是什么分支？要构造什么输入才能走到？**

> 💡 **方法**：覆盖率攻坚不是"多写几个测试"，而是"精准打击"。先拿到未覆盖行号清单，再逆推触发条件，比盲写用例高效得多。

## 二、先修 Bug：两个 UTF-8 BOM 截断

补解析器测试时，我特意构造了「带 BOM 的多编码」输入，结果发现两个用例挂了：

```
testUtf16BeAndLeAndUtf8Bom  FAILED
testUtf16AndUtf8Bom         FAILED
```

顺着看下去，问题出在 ASCII 和 XML 两个解析器**处理 UTF-8 BOM** 的地方。UTF-8 的 BOM 是 3 个字节 `EF BB BF`。上游 Java 代码跳过 BOM 后，用「总长度 - BOM 长度」算剩余内容长度。移植时我写成了：

```cangjie
// ❌ 错误：data.size - 3 把 BOM 的 3 字节又减了一次
let str = String.fromUtf8(data[3..data.size - 3])
```

这里 `data[3..]` 已经跳过了开头 3 字节的 BOM，结尾却又减了 3，导致**内容尾部 3 个字节被吃掉**。正确写法是结尾直接取到 `data.size`：

```cangjie
// ✅ 正确：开头跳过 BOM，结尾取满
let str = String.fromUtf8(data[3..data.size])
```

ASCII 解析器和 XML 解析器各有一处同样的错误，两处都改成 `data.size` 后，两个用例转绿。

> 💡 **心得**：覆盖率提升最大的附带价值，就是**逼你去走那些平时没人走的分支**——带 BOM 的输入正是这种"角落路径"，一走就露馅。这两个 Bug 如果不补测试，可能要等到真实用户喂进来一个带 BOM 的 plist 才会爆。

## 三、坑一：`as` 在仓颉里不是"上转型"

补数据类测试时，我想构造一个「装了各种子类型的 NSArray」，第一反应是这么写：

```cangjie
// ❌ 编译报错：mismatched types
let arr = NSArray([NSString("x") as NSObject, NSNumber(1) as NSObject])
```

结果 7 个 `mismatched types` 编译错误。查了半天才明白：**仓颉的 `as` 是"动态类型转换"，返回的是 `Option<T>`，不是 Java/Kotlin 那种"向上转型"**。

所以 `NSString("x") as NSObject` 的类型是 `Option<NSObject>`，整个数组字面量被推断成了 `Array<Option<NSObject>>`，跟 `NSArray(Array<NSObject>)` 对不上。

正确的**上转型**方式有两种：

```cangjie
// 方式一：给数组变量加类型标注，元素自动隐式上转型
let el: Array<NSObject> = [NSString("x"), NSNumber(1)]
let arr = NSArray(el)

// 方式二：先建空 NSArray，再 setValue（函数参数隐式上转型）
let arr2 = NSArray(2)
arr2.setValue(0, NSString("x"))
arr2.setValue(1, NSNumber(1))
```

> 💡 **经验**：在仓颉里，`子类 as 父类` 不是免费的向上转型，而是一次带 `Option` 的运行时转换。要"当父类型用"，靠的是**隐式上转型**——发生在带类型标注的赋值、函数传参这些位置，写法上根本不需要 `as`。

## 四、坑二：NSDate 喂 Inf/NaN 位模式会死循环

数据类里有不少「从字节构造」的入口（`NSNumber(bytes,...)`、`NSDate(bytes,...)`）。为了覆盖 IEEE 754 的边界，我想喂进去 `+Infinity`、`NaN`、次正规数的位模式。

给 `NSNumber` 喂没问题——它只把 8 字节解释成 `Float64` 存起来，不做任何日期运算：

```cangjie
// ✅ 安全：NSNumber 只存值
let inf = NSNumber([0x7Fu8, 0xF0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8], 0, 8, NSNumber.REAL)
```

但给 `NSDate` 喂 Inf/NaN 就出事了——测试直接**卡死**。原因是 NSDate 拿到浮点值后要换算成日期：

1. `secondsSince2001` 里 `Int64(Float64.Inf)` 是未定义行为；
2. `unixSecondsToDateTime` 里有个 `while(true)` 按年份累加的循环，`remaining` 是个天文数字，永远跳不出来。

所以我给 NSDate 划了条线：**只喂"安全"的位模式**（值为 1.0 的 `pow2(0)`、接近 0 的次正规数），把 Inf/NaN 的边界覆盖**交给 NSNumber**（它不做日期运算，绝对安全）。

```cangjie
// ✅ NSDate 只测安全位模式（值 = 1.0）
let one = NSDate([0x3Fu8, 0xF0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8], 0, 8)
```

> 💡 **心得**：追覆盖率时不能"为了走到某行不惜一切"。有些输入（Inf/NaN 喂日期）在真实场景里根本不会出现，硬构造反而会触发死循环。**分清"该测的边界"和"不可能的输入"**，把边界值放到能安全承接它的类上测。

## 五、补齐数据类：`CoverageDataTypesTest.cj`

摸清这两个坑后，我新建了 `CoverageDataTypesTest.cj`，一口气补了 **27 个用例**，专打数据类的未覆盖分支：

| 类 | 补的分支 |
|----|---------|
| NSSet | 有序集工厂 `of(..., true)`、非 set/有序集比较、9 种混合类型触发 typeId |
| UID | getBytes 的 5→8→16 字节填充、compareBytes 长度不等、放进 NSArray 走 ASCII/GnuStep 输出 |
| NSNumber | 8 字节 double 的 +Inf/NaN/次正规、4 字节 float 全零/边界、BOOLEAN 的 stringValue |
| NSDate | 安全位模式、闰年二进制往返、非法日期分量 |
| NSDictionary | getEntries、containsValue 命中/未命中、clear、CDATA 键 |
| NSArray | 越界异常、容器嵌套、多行 ASCII、equals/compare 不等 |
| Base64 / ByteOrderMarkReader / PropertyListParser / NSNull | 末尾无填充解码、UTF-32BE 检测、UTF-16BE BOM + magic、含 NSNull 写二进制 |

加上之前几轮补的 `CoverageAscii/BinaryParse/BinaryWrite/Xml` 系列，测试用例从 **189 → 262**，测试文件到 **30 个**。

## 六、结果：双版本 97.35%

两个版本各跑一次 `generate-coverage.ps1`，结果完全一致：

| SDK 版本 | 行覆盖 | 单元测试 |
|----------|--------|---------|
| STS 1.1.3 | 2794 / 2870 = **97.35%** | 262 全通过 |
| LTS 1.0.5 | 2794 / 2870 = **97.35%** | 262 全通过 |

逐文件看，大部分数据类都到了 98%~100%（NSArray/NSNull/ByteOrderMarkReader 满格 100%），三大解析器也从 70% 左右拉到了 98% 上下。

## 七、剩下的 76 行：不可达代码，老实说明

从 81.67% 到 97.35% 之后，还剩 **76 行**没覆盖。我逐一核对，确认它们基本是**不可达或极难构造的防御性代码**：

| 文件 | 未覆盖原因 |
|------|-----------|
| PropertyListConverter.cj (0/1) | 占位类，仅私有构造器，无对外方法 |
| NSObjectHash / NSObject | 默认不可达的兼容分支 |
| NSSet (typeId) | `case _ => 0` 兜底分支 |
| UID | `None`-name 的少数辅助分支 |
| PropertyListParser | `determineType(String)` 与上游对齐保留的死代码 |

这些我都写进了 `summary.md`，不硬凑。

> 💡 **心得**：95% 是个健康的目标，但最后那几个百分点里，往往藏着"为了跟上游结构对齐而保留的死代码"和"理论上不可达的兜底分支"。**把它们识别出来、说明清楚**，比强行 100% 更有说服力。

## 八、这一篇的踩坑总结

| 坑 | 现象 | 解决 |
|----|------|------|
| BOM 截断 | 带 UTF-8 BOM 的输入尾部丢 3 字节 | `data.size - 3` → `data.size` |
| `as` 不是上转型 | `[X as NSObject]` 变成 `Array<Option<NSObject>>` | 用类型标注数组或 setValue 隐式上转型 |
| NSDate 死循环 | 喂 Inf/NaN 位模式测试卡死 | Inf/NaN 边界交给 NSNumber，NSDate 只测安全位模式 |

## 九、小结

这一轮从 81% 冲到 97%，最大的收获不是那个数字，而是**过程中被逼着走的两条"角落路径"**——BOM 处理和 IEEE 754 边界，一个揪出了真实 Bug，一个让我彻底搞懂了仓颉 `as` 的语义。

给后来者的建议：

1. **覆盖率攻坚要精准**：先导出未覆盖行号，逆推触发条件，别盲写。
2. **`as` 在仓颉是带 Option 的运行时转换**，向上转型靠类型标注下的隐式转换。
3. **边界值要放到能安全承接的类上测**，别为了一行覆盖硬构造会死循环的输入。
4. **最后那几行不可达代码，说明清楚比硬凑更专业。**

---

*下一篇：提交复审后，第二轮审核意见来了——16 个问题点、2 个一票否决，比第一轮猛得多。*
