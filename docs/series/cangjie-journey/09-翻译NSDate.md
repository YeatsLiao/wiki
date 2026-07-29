# 第 9 篇：翻译 NSDate——手动解析日期字符串，告别 SimpleDateFormat

> 本系列第 9 篇。上一篇翻完了 `NSData` + Base64。这一篇轮到日期类型 `NSDate`——上游只有 224 行，看起来很简单，但 Java 的 `SimpleDateFormat` 在仓颉里不存在。最终我用 `std.time.DateTime` 替代 `java.util.Date`，并手动解析固定格式的日期字符串。过程中又踩了 `Month` 枚举、`padStart` 命名参数、`StringBuilder` 链式调用等坑。

---

## 一、NSDate 是什么

`NSDate` 是日期的包装类，对齐 Apple Foundation 的同名概念。plist 里的 `<date>` 标签就是它——内容以固定格式的字符串存储。上游 `NSDate.java` 提供：

- 四种构造：byte[]（二进制）、String（文本）、Date（Java 日期）、默认
- `getDate()` 返回内部 Date
- `equals`/`hashCode`/`clone`/`compareTo` 全套
- `toXML`/`toASCII`/`toASCIIGnuStep` 输出

整体 224 行，是到目前为止最简单的一个类。但它依赖 `SimpleDateFormat` 做日期解析和格式化——这在仓颉标准库里没有。

## 二、日期解析：手动 vs 标准库

Java 版用 `SimpleDateFormat` 定义两种格式模板，直接 `parse()` / `format()`。仓颉的 `std.time` 包有 `DateTime.parse()` 和 `DateTime.format()`，但格式字母和 Java 不完全一样，而且 plist 的日期格式是固定的（XML: `yyyy-MM-ddTHH:mm:ssZ`，GnuStep: `yyyy-MM-dd HH:mm:ss +0000`），没必要引入通用解析器。

最终方案：**手动解析固定格式**。因为格式完全固定（年、月、日、时、分、秒的位置都是确定的），只需要按位置截取字符、转整数、喂给 `DateTime.ofUTC()` 就行。

### 核心实现

```cangjie
// XML 格式: "2001-01-01T00:00:00Z"（固定 20 字符）
private static func parseFixed(s: String): DateTime {
    let runes = s.toRuneArray()
    let year = NSDate.parseIntRunes(runes, 0, 4)
    let month = NSDate.parseIntRunes(runes, 5, 2)
    let day = NSDate.parseIntRunes(runes, 8, 2)
    let hour = NSDate.parseIntRunes(runes, 11, 2)
    let minute = NSDate.parseIntRunes(runes, 14, 2)
    let second = NSDate.parseIntRunes(runes, 17, 2)
    DateTime.ofUTC(year: year, month: month, dayOfMonth: day,
                   hour: hour, minute: minute, second: second)
}
```

`parseIntRunes` 从 Rune 数组的指定位置提取固定宽度的子串，转成 `Int64`：

```cangjie
private static func parseIntRunes(runes: Array<Rune>, start: Int64, len: Int64): Int64 {
    var sb = StringBuilder()
    for (i in start..(start + len)) {
        sb.append(runes[i])
    }
    let parsed = Int64.tryParse(sb.toString())
    match (parsed) {
        case Some(v) => v
        case None => throw IllegalArgumentException("Invalid date component")
    }
}
```

## 三、格式化输出：手动拼接

Java 版用 `sdf.format(date)` 一行搞定。仓颉版需要手动从 `DateTime` 取出各分量再拼接。这里有两个坑。

### 坑 1：`dt.month` 返回的是 Month 枚举，不是 Int64

`DateTime.month` 的类型是 `Month` 枚举（January、February……），不能直接当数字用。要调用 `.toInteger()` 转成 1~12 的整数：

```cangjie
// 错误
let mo = NSDate.pad2(dt.month)  // Month 不是 Int64

// 正确
let mo = NSDate.pad2(dt.month.toInteger())
```

### 坑 2：`padStart` 需要命名参数

仓颉的 `String.padStart()` 第二个参数（填充字符）是命名参数，必须写 `padding:`：

```cangjie
// 错误
"42".padStart(4, "0")  // 编译报错

// 正确
"42".padStart(4, padding: "0")  // "0042"
```

### 坑 3：`StringBuilder.append()` 返回 Unit，不能链式调用

Java 里 `sb.append(a).append(b).append(c)` 很常见。仓颉的 `StringBuilder.append()` 返回 `Unit`，不是 `StringBuilder` 本身，所以不能链式调用。只能分步写：

```cangjie
// 错误（Java 习惯）
sb.append(y).append("-").append(mo)

// 正确（仓颉方式）
sb.append(y); sb.append("-"); sb.append(mo)
```

## 四、其他注意事项

### `Int64.tryParse` 需要 `import std.convert.*`

`tryParse` 是 `Parsable` 接口的方法，定义在 `std.convert` 包里。不导入的话编译器报「undeclared identifier」。

### `DateTime` 是 struct（值类型）

仓颉的 `DateTime` 是结构体，赋值和传参都是值拷贝，不需要像 Java 的 `Date` 那样做 `.clone()`。`NSDate.clone()` 里直接传 `this.dateTime` 就行：

```cangjie
public func clone(): NSObject {
    NSDate(this.dateTime)  // DateTime 是 struct，自动拷贝
}
```

### 暂缓实现的部分

和上游对比，以下功能暂缓：
- `NSDate(byte[])` / `NSDate(byte[], int, int)` —— 依赖 `BinaryPropertyListParser.parseDouble()`
- `toBinary()` —— 依赖 `BinaryPropertyListWriter`
- `toJavaObject()` —— 依赖基类反射胶水

## 五、验证：12 个测试，42/42 全绿

针对 XML 构造、GnuStep 构造、toString 格式、XML 往返、equals、compare、clone、hashCode、className、XML 输出、DateTime 构造、非法日期抛异常都写了用例：

```
[ PASSED ] testXmlConstructor
[ PASSED ] testGnuStepConstructor
[ PASSED ] testToStringXmlFormat
[ PASSED ] testXmlRoundTrip
[ PASSED ] testEquals
[ PASSED ] testCompare
[ PASSED ] testClone
[ PASSED ] testHashCode
[ PASSED ] testClassName
[ PASSED ] testXmlOutput
[ PASSED ] testDateTimeConstructor
[ PASSED ] testInvalidDateThrows
Summary: TOTAL: 42, PASSED: 42, FAILED: 0
```

## 六、这一步的收获

1. **`DateTime.month` 返回 Month 枚举**：不是 Int64，要 `.toInteger()` 转数字。
2. **`padStart` 需要命名参数 `padding:`**：仓颉很多标准库函数使用命名参数，不能全靠位置。
3. **`StringBuilder.append()` 返回 Unit**：不能链式调用，只能分步写。
4. **`Int64.tryParse` 在 `std.convert` 包**：不导入就找不到。
5. **`DateTime` 是 struct**：值类型，传参赋值自动拷贝，不需要手动 clone。
6. **固定格式日期可以手动解析**：不需要通用解析器，按位置截取 + 转整数更简单可靠。

---

**下一篇（待更新）**：翻译 `UID` 类型——看看这个只有几行的小类在仓颉里怎么处理。
