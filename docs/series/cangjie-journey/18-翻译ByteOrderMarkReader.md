# 第 18 篇：翻译 ByteOrderMarkReader——BOM 检测与字节比较的坑

> 本系列第 18 篇。上一篇完成了 `ParsedObjectStack`。这一篇翻译 `ByteOrderMarkReader`——Unicode 字节序标记检测器，116 行。

## 一、ByteOrderMarkReader 是什么

plist 文件可能以多种 Unicode 编码存储（UTF-8、UTF-16BE/LE、UTF-32BE/LE）。解析器需要先检测文件开头的 BOM（Byte Order Mark）来确定编码。`ByteOrderMarkReader` 就是这个检测工具。

两种使用模式：
- **逐字节**：`readByte(b)` 每次处理一个字节，逐步缩小可能的编码范围
- **一次性**：静态方法 `detect(bytes)` 直接检测完整字节数组

## 二、翻译要点

### BOM 表用 `Array<Array<Int64>>`

上游用 `int[][]` 存储五种 BOM 模式。仓颉版用 `Array<Array<Int64>>`：

```cangjie
private static let BOMS: Array<Array<Int64>> = [
    [0xEF, 0xBB, 0xBF],           // UTF-8
    [0xFE, 0xFF],                  // UTF-16BE
    [0xFF, 0xFE],                  // UTF-16LE
    [0x00, 0x00, 0xFE, 0xFF],     // UTF-32BE
    [0xFF, 0xFE, 0x00, 0x00],     // UTF-32LE
]
```

### detect 方法中的字节比较

`detect` 方法直接比较字节数组的前几个字节。仓颉的 `Byte` 就是 `UInt8`，比较时用 `u8` 后缀：

```cangjie
let b0 = bytes[0]
if (b0 == 0xEFu8 && b1 == 0xBBu8 && b2 == 0xBFu8) {
    return Some("UTF-8")
}
```

## 三、踩坑实录

### 坑 1：`match` 是关键字不能做变量名

上游 Java 代码里有个局部变量叫 `match`：

```java
boolean match = this.offset < bom.length && bom[this.offset] == b;
```

仓颉里 `match` 是关键字（用于模式匹配表达式），不能做变量名。改为 `matches`。

### 坑 2：`0..<n` 范围语法不存在

仓颉的范围是 `a..b`（闭区间），没有 `..<` 半开语法。改为 `0..size - 1`。

### 坑 3：`Byte(0xEF)` 构造不可用

测试中用 `Byte(0xEF)` 创建字节数组元素，编译报错。从之前的经验知道，要用 `UInt8(0xEF)` 代替。

## 四、验证：8 个测试，131/131 全绿

```
[ PASSED ] testDetectUtf8Bom
[ PASSED ] testDetectUtf16BeBom
[ PASSED ] testDetectUtf16LeBom
[ PASSED ] testDetectUtf32LeBom
[ PASSED ] testDetectNoBom
[ PASSED ] testReadByteUtf8
[ PASSED ] testReadByteNoMatch
[ PASSED ] testReadByteUtf16Be
Summary: TOTAL: 131, PASSED: 131, FAILED: 0
```

**下一篇**：翻译 `XMLPropertyListWriter`——最简单的写出器。
