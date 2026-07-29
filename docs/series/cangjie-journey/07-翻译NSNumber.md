# 第 7 篇：翻译 NSNumber——被关键字、NaN 和溢出教育的一课

> 本系列第 7 篇。上一篇翻完了基类 `NSObject` 和字符串 `NSString`。这一篇啃数值类型 `NSNumber`——它一个类同时装整数、浮点、布尔三种值，翻译时接连撞上仓颉的关键字、数值转换、NaN/无穷等一堆「跨语言细节」，很适合拿来讲。

---

## 一、NSNumber 是什么

plist 里的数字和布尔值都由 `NSNumber` 承载。它内部用一个 `type` 标记当前是哪种：

- `INTEGER`：整数（Java 用 `long` 存）
- `REAL`：实数（Java 用 `double` 存）
- `BOOLEAN`：布尔

对外提供一堆构造函数（从 int/long/double/boolean/字符串构造）和取值方法（`longValue`/`doubleValue`/`boolValue`/`stringValue`……），以及 XML/ASCII 输出。整体 518 行。

## 二、连环踩坑实录

这个类几乎每个细节都在提醒我「仓颉不是 Java」。

### 坑 1：`type` 是关键字，方法名都不让用

上游有个方法 `type()` 返回类型标志。仓颉直接编译报错：

```
error: expected a func name after keyword 'func', found keyword 'type'
```

`type` 在仓颉里是保留关键字（用于类型别名），**不能当方法名**。活动要求「接口名尽量不改」，但这里是语言硬限制，只能改。我把它改成 `getType()`，并在注释里明确标注：

> 这是**唯一一处强制偏差**——因关键字冲突不得已为之，不是随意改名。

> 💡 移植时遇到目标语言的关键字撞车，改名是合理的，但**一定要记录下来、说明原因**，方便审核和使用者对照。

### 坑 2：`match` 静态常量，匹配到的是「变量」不是「值」

我想照 Java 的 `switch(type)` 写成：

```cangjie
match (this.numberType) {
    case INTEGER => ...   // 想匹配「等于 INTEGER 常量」
}
```

但仓颉的 `case INTEGER` 会把 `INTEGER` 当成一个**新的绑定变量名**（把值绑给它），而不是「和 INTEGER 常量比较」。结果是所有值都命中第一个分支，逻辑全错。

正确写法是老老实实用 `if`：

```cangjie
if (this.numberType == INTEGER) { ... }
else if (this.numberType == REAL) { ... }
```

> 这是从 switch 语言转过来的人**极容易中招**的点：模式匹配里的裸标识符是「绑定」，不是「引用已有常量」。

### 坑 3：数值转换会「抛异常」，不是悄悄截断

Java 里 `(int) someLong`、`(long) someDouble` 都是静默截断。仓颉不一样——`Int32(超出范围的Int64)`、`Int64(NaN)`、`Int64(无穷)` 都会**抛 `OverflowException`**。

所以像「把 double 存成 long 备用」这种代码，必须先判断：

```cangjie
this.longVal = if (d.isNaN() || d.isInf()) { 0 } else { Int64(d) }
```

否则一个 `NSNumber(Double.NaN)` 就能让程序崩掉。仓颉这点其实更安全，但移植时得**主动加防护**。

### 坑 4：解析字符串的 API 藏在 std.convert

Java 的 `Long.parseLong` / `Double.parseDouble` / 十六进制 `parseLong(s, 16)`，在仓颉对应：

- `Int64.tryParse(s): Option<Int64>`（失败返回 `None`，不抛异常，正合适）
- `Int64.tryParse(s, radix: 16)`（十六进制，处理 `0x` 前缀）
- `Float64.tryParse(s): Option<Float64>`

它们都在 **`std.convert`** 包里，要 `import std.convert.*`。用 `tryParse` + `match Option` 来复刻 Java「先试整数，失败再试浮点，都不行才报错」的逻辑，特别干净：

```cangjie
match (intOpt) {
    case Some(l) => /* 整数 */
    case None => match (Float64.tryParse(text)) {
        case Some(d) => /* 实数 */
        case None => throw IllegalArgumentException("...")
    }
}
```

### 坑 5：NaN 和无穷的判断

Java 用 `Double.isNaN`、`== Double.POSITIVE_INFINITY`。仓颉 `Float64` 自带 `isNaN()`、`isInf()`，无穷则用 `Float64.Inf` / `-Float64.Inf` 常量比较。功能一一对得上，只是名字变了。

## 三、验证：8 个测试，17/17 全绿

针对三种类型、文本解析（含十六进制、YES/NO、nan、±infinity）、比较、克隆、XML 输出、以及「NaN 取整数值该抛异常」都写了用例：

```
[ PASSED ] testIntegerBasics
[ PASSED ] testParseFromText
[ PASSED ] testInvalidTextThrows
[ PASSED ] testIntegerValueNotAvailable
...
Summary: TOTAL: 17, PASSED: 17, FAILED: 0
```

其中我特别喜欢用仓颉的 `@ExpectThrows[IllegalArgumentException](...)` 来验证「非法输入必须抛异常」，比 Java 的 try-catch 断言简洁多了。

## 四、这一步的收获

1. **关键字冲突要改名并记录**：`type()` → `getType()`，注明原因，不算破坏一致性。
2. **模式匹配里的裸标识符是「绑定」**：匹配常量值得用 `if (x == 常量)`，别用 `case 常量`。
3. **仓颉数值转换会抛溢出异常**：涉及 int/long/double 互转、NaN、无穷时要先兜底判断。
4. **善用 `tryParse` + `Option`**：复刻「层层尝试解析」的逻辑既安全又清晰。
5. **一个类三种状态**：用 `if (type == X)` 分派，每个输出/取值方法都要覆盖三种类型 + 非法类型兜底。

---

**下一篇（待更新）**：翻译二进制数据类型 `NSData`——会正式用上仓颉标准库的 Base64 编解码，看看能不能省掉上游那个 1800 行的自带 Base64 实现。
