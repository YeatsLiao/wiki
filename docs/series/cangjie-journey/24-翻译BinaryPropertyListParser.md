# 第 24 篇：翻译 BinaryPropertyListParser——二进制 plist 解析器

> 本系列第 24 篇。上一篇完成了 `PropertyListParser` 骨架。这一篇翻译 405 行的 `BinaryPropertyListParser`，并在调试过程中发现了仓颉 `for (i in 0..n)` 循环的一个重大 bug。

## 一、BinaryPropertyListParser 概览

二进制 plist 解析器，核心职责：

1. 解析 trailer（最后 32 字节）获取元信息
2. 通过 offset table 定位每个对象
3. 按类型分派解析：simple / int / real / date / data / ascii / utf16 / utf8 / uid / array / set / dict

上游 Java 版基于 `InputStream` 随机读取，仓颉版改为 `Array<Byte>` + 偏移量计算。

## 二、翻译要点

### 字节数组构造器前置

解析器需要直接从字节数组构造 `NSString`、`NSNumber`、`NSDate`。这些构造器在上一轮已经添加：

- `NSString(bytes, start, end, charsetName)` — 支持 ASCII / UTF-8 / UTF-16-BE
- `NSNumber(bytes, start, end, numType)` — 含 IEEE 754 位模式转换
- `NSDate(bytes, start, end)` — 8 字节 double（自 2001-01-01）

### trailer 解析

```cangjie
let trailerStart = this.bytes.size - 32
this.offsetSize = parseUnsignedInt(bytes, trailerStart + 6, trailerStart + 7)
this.objectRefSize = parseUnsignedInt(bytes, trailerStart + 7, trailerStart + 8)
this.numObjects = parseUnsignedInt(bytes, trailerStart + 8, trailerStart + 16)
let topObject = parseUnsignedInt(bytes, trailerStart + 16, trailerStart + 24)
this.offsetTableOffset = parseUnsignedInt(bytes, trailerStart + 24, trailerStart + 32)
```

### 递归解析 + 缓存

`parseObject(stack, objID)` 递归解析对象，用 `HashMap<Int64, NSObject>` 缓存已解析对象避免重复。

## 三、重大 Bug 发现：`for (i in 0..n)` 丢失末尾元素

### 症状

5 个 round-trip 测试中 4 个失败，报错 `IndexOutOfBoundsException: index 98 > array size 76`。

### 追踪过程

1. **定位 trailer 异常**：解析出的 `offsetTableOffset = 0`，但 Writer 实际写入了正确值
2. **定位 Writer buffer 正确**：直接读 `w.buf` 最后 8 字节，数据正确
3. **定位 writeToArray 拷贝丢失**：`result` 数组最后 8 字节全是 0，而 `buf` 中数据正确

问题代码：
```cangjie
// 有 bug 的写法
var result = Array<Byte>(w.count, { _ => UInt8(0) })
for (i in 0..w.count - 1) {
    result[i] = w.buf[i]
}
```

当 `w.count` 是 `Int64` 时，`for (i in 0..w.count - 1)` **不能正确遍历所有元素**，导致末尾字节未被拷贝。

### 修复

将所有 `for (i in 0..int64Value)` 改为 `while` 循环：

```cangjie
// 正确的写法
var ci: Int64 = 0
while (ci < w.count) {
    result[ci] = w.buf[ci]
    ci = ci + 1
}
```

同样的 bug 影响了：
- `BinaryPropertyListWriter.ensureBuf` — buffer 扩容拷贝
- `BinaryPropertyListWriter.ensureIdMap` — ID 映射扩容
- `BinaryPropertyListWriter.doWrite` — 对象写入和 offset table 写入
- `NSString.toBinary` — 字符串转字节数组

全部改为 `while` 循环后，Writer 输出恢复正常。

### 教训

> **仓颉的 `for (i in 0..n)` 当 `n` 为 `Int64` 时可能丢失末尾元素。涉及 `Int64` 范围的循环，请一律使用 `while` 循环。**

## 四、NSDictionary.compareWithDict 空指针修复

`compareWithDict` 在比较两个不同键集的 NSDictionary 时，直接调用 `other.dict.get(key).getOrThrow()` 而不先检查 key 是否存在，导致 `NoneValueException`。

修复：在取值前先调用 `other.dict.contains(key)` 检查。

## 五、测试

5 个 round-trip 测试（write → parse → verify）：

| 测试 | 内容 |
|------|------|
| testParseSimpleDict | 3 键字典（字符串、整数、布尔） |
| testParseArray | 3 元素数组 |
| testParseNestedDict | 嵌套字典 |
| testParseData | NSData 二进制数据 |
| testParseUnsignedInt | 无符号整数解析工具 |

全部 160 个测试通过。

下一篇继续翻译 `XMLPropertyListParser` 或 `ASCIIPropertyListParser`。
