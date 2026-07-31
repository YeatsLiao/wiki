# 第 10 篇：翻译 UID——没有 BigInteger，用字节数组手写大数

> 本系列第 10 篇。上一篇翻完了 `NSDate`。这一篇轮到 `UID`——上游只有 190 行，是 plist 里最小的叶子类型之一。但它依赖 Java 的 `BigInteger` 来存储最多 128 位的无符号整数，而仓颉标准库没有 BigInteger。最终我用 `Array<Byte>` 手动实现了大端无符号字节数组的比较、十六进制转换和填充逻辑。

## 一、UID 是什么

`UID` 是唯一标识符类，**仅在二进制 plist 的 keyed archive 中出现**。Apple 用它来引用归档中的对象。上游 `UID.java` 提供：

- 两种构造：`(String name, BigInteger value)` 和 `(String name, byte[] bytes)`
- `getBytes()` 返回大端字节表示（填充到 1/2/4/8/16 字节）
- `getName()` 返回名称
- `equals`/`hashCode`/`clone`/`compareTo` 全套
- `toXML`（输出为 `{CF$UID: value}` 字典）、`toASCII`/`toASCIIGnuStep`（十六进制字符串）

整体 190 行，逻辑不复杂。核心挑战是 **BigInteger 的替代方案**。

## 二、BigInteger 的替代

上游用 `java.math.BigInteger` 存储 UID 值，利用它自带的：
- 任意精度比较
- `toString(16)` 十六进制转换
- `toByteArray()` 大端字节输出
- `bitLength()` 位数检查

仓颉没有 BigInteger。但 UID 最大只有 128 位（16 字节），所以可以用 `Array<Byte>` 存储大端无符号字节，手动实现需要的操作。

### 存储方案

```cangjie
/** UID 值：大端无符号字节数组（最多 16 字节 = 128 位）。 */
private var uidBytes: Array<Byte>
```

构造时自动去除前导零，保持最简表示。

### 比较：无符号大端字节数组

```cangjie
private static func compareBytes(a: Array<Byte>, b: Array<Byte>): Ordering {
    let sa = UID.stripLeadingZeros(a)
    let sb = UID.stripLeadingZeros(b)
    // 长度不同 → 长的更大
    if (sa.size != sb.size) {
        if (sa.size < sb.size) { return Ordering.LT }
        return Ordering.GT
    }
    // 长度相同 → 逐字节比较（无符号）
    for (i in 0..sa.size) {
        let ua = UInt32(sa[i]) & UInt32(255)
        let ub = UInt32(sb[i]) & UInt32(255)
        if (ua < ub) { return Ordering.LT }
        if (ua > ub) { return Ordering.GT }
    }
    Ordering.EQ
}
```

关键点：Byte 是有符号的（UInt8），比较前必须转 UInt32 并 `& 255` 做无符号化。

### 十六进制转换

```cangjie
private static let HEX_RUNES: Array<Rune> = "0123456789abcdef".toRuneArray()

private func toHexString(): String {
    let sb = StringBuilder()
    for (b in this.uidBytes) {
        let v = UInt32(b) & UInt32(255)
        sb.append(UID.HEX_RUNES[Int64(v / UInt32(16))])
        sb.append(UID.HEX_RUNES[Int64(v % UInt32(16))])
    }
    sb.toString()
}
```

## 三、连环踩坑实录

### 坑 1：`0 as Byte` 被解析为 `Option<UInt8>`

仓颉的类型转换语法 `expr as Type` 在某些上下文会产生歧义。`Array(size, repeat: 0 as Byte)` 中的 `0 as Byte` 被解析为 `Option<UInt8>` 而不是 `UInt8`，导致泛型推断失败。

```cangjie
// 错误
let arr: Array<Byte> = Array(4, repeat: 0 as Byte)  // 泛型推断失败

// 正确
let arr: Array<Byte> = Array(4, repeat: UInt8(0))
```

同样的问题出现在 `255 as UInt32`：

```cangjie
// 错误
let v = UInt32(b) & 255 as UInt32  // 255 as UInt32 被解析为 Option<UInt32>

// 正确
let v = UInt32(b) & UInt32(255)
```

**教训**：在仓颉中做数值类型转换，优先用 `Type(value)` 构造语法，避免 `value as Type` 在复杂表达式中的歧义。

### 坑 2：match case 里用 `{ }` 块被解析为 lambda

```cangjie
// 错误
match (x) {
    case Some(n) => {
        let sb = StringBuilder()
        sb.append(n)
        sb.toString()
    }
}
```

仓颉把 `{ }` 解析为 lambda 表达式，报「expected '=>' in lambda expression」。解决方案：要么用单个表达式，要么提取为独立方法。

```cangjie
// 方案 1：单表达式
match (x) {
    case Some(n) => "value: " + n
    case None => "empty"
}

// 方案 2：提取方法
match (x) {
    case other: UID => UID.compareUIDs(this, other)
    case _ => this.getClassName().compare(that.getClassName())
}
```

### 坑 3：hashCode 中 `31 * result` 溢出

上游 Java 的 `hashCode` 用 `int` 运算，溢出是定义好的回绕行为。仓颉的 `Int64` 乘法溢出会抛 `OverflowException`。

```cangjie
// 错误（Java 习惯，仓颉会抛 OverflowException）
result = 31 * result + byteValue

// 正确（避免乘法，用加法组合）
h = h + byteValue
```

### 坑 4：`Option` 没有 `unwrap()` 方法

Java 的 `Optional.get()` 在仓颉里对应 `.getOrThrow()`。一开始写了 `Option.unwrap()` 编译报错。

```cangjie
// 错误
uid.getName().unwrap()

// 正确
uid.getName().getOrThrow()
```

## 四、构造函数的简化

上游有两种构造：
- `UID(String, BigInteger)` → 仓颉没有 BigInteger，改为 `UID(String, Int64)`
- `UID(String, byte[])` → 直接保留

`Int64` 版本覆盖绝大多数常见场景（UID 值通常在整数范围内）。`byte[]` 版本用于二进制 plist 解析时的大值。

### 从 Int64 转大端字节

```cangjie
private static func longToBytes(value: Int64): Array<Byte> {
    if (value == 0) { return [UInt8(0)] }
    var temp: Array<Byte> = Array(8, repeat: UInt8(0))
    var v = value
    var pos: Int64 = 7
    while (v > 0) {
        temp[pos] = UInt8(v & 255)
        v = v >> 8
        pos--
    }
    // 去除前导零
    let start = pos + 1
    let len = 8 - start
    let result: Array<Byte> = Array(len, repeat: UInt8(0))
    for (i in 0..len) { result[i] = temp[start + i] }
    result
}
```

## 五、验证：14 个测试，56/56 全绿

针对 Long 构造、byte[] 构造、getBytes 填充、toString 十六进制、equals、compare、clone、hashCode、className、ASCII 输出、负值抛异常、超长字节抛异常都写了用例：

```
[ PASSED ] testLongConstructor
[ PASSED ] testBytesConstructor
[ PASSED ] testGetBytesPadding
[ PASSED ] testGetBytesFromLong
[ PASSED ] testToStringHex
[ PASSED ] testToStringNoName
[ PASSED ] testEquals
[ PASSED ] testCompare
[ PASSED ] testClone
[ PASSED ] testHashCode
[ PASSED ] testClassName
[ PASSED ] testAsciiOutput
[ PASSED ] testNegativeValueThrows
[ PASSED ] testOversizedBytesThrows
Summary: TOTAL: 56, PASSED: 56, FAILED: 0
```

## 六、这一步的收获

1. **`0 as Byte` 有歧义**：在泛型推断上下文中用 `UInt8(0)` 代替 `0 as Byte`，避免被解析为 `Option`。
2. **`expr as Type` 在复杂表达式中不安全**：优先用 `Type(expr)` 构造语法。
3. **match case 的 `{ }` 是 lambda**：多语句逻辑提取为独立方法，或用单表达式。
4. **Int64 乘法溢出会抛异常**：不像 Java int 自动回绕，仓颉 Int64 溢出是运行时错误。
5. **Option 用 `getOrThrow()` 取值**：不是 `unwrap()`。
6. **没有 BigInteger 也能处理大数**：128 位以内的整数用 `Array<Byte>` 手动实现就够了。

**下一篇（待更新）**：翻译 `NSNull`——最简单的类型，只有几行代码。
