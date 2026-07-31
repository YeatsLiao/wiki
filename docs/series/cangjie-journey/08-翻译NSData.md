# 第 8 篇：翻译 NSData——自带 Base64、类型别名与重载冲突

> 本系列第 8 篇。上一篇翻完了数值类型 `NSNumber`。这一篇轮到二进制数据 `NSData`——它本身只有 220 行，但因为需要 Base64 编解码，不得不先把上游那个 2000+ 行的 `Base64.java` 也处理掉。翻译过程中又撞上仓颉的类型别名、构造函数重载、`StringBuilder` 缺失重载等一系列「看着不起眼但编译就是不过」的问题。

## 一、NSData 是什么

`NSData` 是字节缓冲的包装类，对齐 Apple Foundation 的同名概念。plist 里的 `<data>` 标签就是它——内容以 Base64 编码存储。上游 `NSData.java` 提供：

- 三种构造：字节数组、Base64 字符串、文件路径
- `bytes()`/`length()` 基础访问
- `getBase64EncodedData()` 编码回 Base64
- `equals`/`hashCode`/`clone`/`compareTo` 全套
- `toXML`/`toASCII`/`toASCIIGnuStep` 输出

整体 220 行，不算复杂。但它依赖 Base64 编解码——上游自带了一个 2125 行的 `Base64.java`。

## 二、Base64：自己写还是用标准库？

仓颉有 `stdx.encoding.base64`，但需要额外安装 stdx 扩展包，当前环境没装（`CANGJIE_STDX_PATH` 未设置）。考虑到共建要求「拿到就能编」，我决定**自行实现一个最简 Base64**，只保留 NSData 需要的编码/解码子集。

### 实现要点

- **编码** `encodeBytes(source: Array<Byte>): String`：经典的 3 字节 → 4 字符查表法，不足 3 字节时用 `=` 填充。
- **解码** `decode(s: String): Array<Byte>`：建一张 128 项的 DECODABET 查找表，把 ASCII 码映射回 6 位值。空白符标记 -5（跳过），`=` 填充符标记 -2（当 0 处理，最后减去填充字节数），非法字符标记 -1（抛异常）。

> 💡 如果后续 stdx 可用，可以把 `Base64.cj` 替换成 `stdx.encoding.base64` 的封装，公开接口不变。

## 三、连环踩坑实录

### 坑 1：`String[index]` 返回的是 Byte，不是 Rune

Java 的 `str.charAt(i)` 返回字符。仓颉的 `String` 是 UTF-8 字节序列，`str[i]` 返回的是**第 i 个字节**（`Byte`），不是第 i 个字符。

要对字符操作，必须用 `.toRuneArray()` 转成 `Array<Rune>` 再遍历。这在 Base64 编码时特别容易踩坑：

```cangjie
// 错误：ALPHABET 是 String，ALPHABET[i] 返回 Byte
out.append(ALPHABET[index])  // StringBuilder 没有 append(Byte)！

// 正确：先转 Rune 数组
private static let ALPHABET_RUNES: Array<Rune> = ALPHABET.toRuneArray()
out.append(ALPHABET_RUNES[index])  // Rune 有 append 重载 ✓
```

### 坑 2：`Byte(expr)` 不能当构造函数用

Java 里 `(byte) value` 是类型转换。仓颉里 `Byte` 是 `UInt8` 的类型别名，但 `Byte(intExpr)` 会报「no matching function for operator '()'」。正确写法是用 `UInt8(expr)`：

```cangjie
// 错误
out[pos] = Byte((combined >> 16) & 255)

// 正确
out[pos] = UInt8((combined >> 16) & 255)
```

### 坑 3：`Rune` 不是数值类型

想拿字符的 ASCII 码值参与计算，Java 里 `int code = c` 就行。仓颉的 `Rune` 不是数值类型，不能直接 `Int64(rune)`——编译器会报「the expression for numeric type conversion must have a numeric type」。必须先转 `UInt32`：

```cangjie
// 错误
let code = Int64(c)  // c 是 Rune

// 正确
let code = Int64(UInt32(c))
```

### 坑 4：字段名和方法名不能相同

上游有字段 `bytes` 和方法 `bytes()`。仓颉不允许同名——编译报「redefinition of declaration 'bytes'」。我把字段改名为 `data`，方法保持 `bytes()` 不变（对外接口一致）。

### 坑 5：两个 `init(String)` 重载冲突

上游有 `NSData(String base64)` 和 `NSData(String path)` 两个构造。仓颉的参数名不算签名的一部分，两个 `init(String)` 就是重载冲突。解决方案：文件构造改为静态工厂方法 `NSData.fromFile(path)`：

```cangjie
public static func fromFile(path: String): NSData {
    NSData(File.readFrom(path))
}
```

### 坑 6：`File` 在 `std.fs`，不是 `std.io`

看名字直觉 `import std.io.*`，但仓颉的 `File` 类在 **`std.fs`** 包里。导错包直接报「undeclared identifier 'File'」。

### 坑 7：Base64 填充符 `=` 的处理

一开始把 `=` 在 DECODABET 里标记为 -1（和非法字符一样），结果解码 `"SGVsbG8="` 时直接抛异常。正确做法是给 `=` 一个独立标记 -2，解码时当 0 参与位运算，最后从输出长度里减去填充字节数：

```cangjie
// 截断到实际写入长度（减去填充字节数）
outPosn = outPosn - paddingCount
```

## 四、验证：13 个测试，30/30 全绿

针对字节构造、Base64 构造（含去空白）、编解码往返、空数据、比较、克隆、相等、XML 输出、类名、toString、非法 Base64 抛异常都写了用例：

```
[ PASSED ] testBytesConstructor
[ PASSED ] testBase64Constructor
[ PASSED ] testBase64ConstructorWithWhitespace
[ PASSED ] testBase64RoundTrip
[ PASSED ] testGetBase64EncodedData
[ PASSED ] testEmptyData
[ PASSED ] testCompare
[ PASSED ] testClone
[ PASSED ] testEquals
[ PASSED ] testXmlOutput
[ PASSED ] testClassName
[ PASSED ] testToString
[ PASSED ] testInvalidBase64Throws
Summary: TOTAL: 30, PASSED: 30, FAILED: 0
```

## 五、这一步的收获

1. **`String[index]` 返回 Byte**：仓颉字符串是 UTF-8 字节序列，按字符操作要用 `toRuneArray()`。
2. **`StringBuilder` 没有 `append(Byte/UInt8)`**：需要先把字节转成 Rune 或 String 再 append。
3. **`Byte(expr)` 不行，用 `UInt8(expr)`**：类型别名在某些场景不能直接当构造函数用。
4. **`Rune` 不是数值类型**：要取码点参与运算，必须 `UInt32(rune)` 中转。
5. **字段名 ≠ 方法名**：仓颉不允许同名，对外接口优先，内部字段改名。
6. **参数名不算重载签名**：`init(base64: String)` 和 `init(path: String)` 冲突，用静态工厂方法解决。
7. **Base64 填充符要单独处理**：不能和非法字符用同一个标记值。

**下一篇（待更新）**：翻译日期类型 `NSDate`——看看仓颉怎么处理时间戳和日期格式化。
