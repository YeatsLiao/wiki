# 第 19 篇：翻译 XMLPropertyListWriter——最简单的写出器

> 本系列第 19 篇。上一篇完成了 `ByteOrderMarkReader`。这一篇翻译 `XMLPropertyListWriter`——XML plist 写出器，38 行。

---

## 一、XMLPropertyListWriter 是什么

上游的 `XMLPropertyListWriter` 提供三个重载：`write(NSObject, File)`、`write(NSObject, Path)`、`write(NSObject, OutputStream)`，将 NSObject 树序列化为 XML 格式写出。

实际上核心逻辑已经在各 NSObject 子类的 `toXMLPropertyList()` 方法中实现了。Writer 只是一个薄封装层。

## 二、翻译要点

### 仓颉版 API 简化

仓颉版提供两个方法：
- `write(root: NSObject, path: String)`：写入文件路径
- `writeToString(root: NSObject)`：返回 XML 字符串

### 字符串转字节数组

仓颉的 `String` 没有 `getBytes()` 方法。写入文件时需要手动将字符串转为字节数组：

```cangjie
let xml = root.toXMLPropertyList()
let bytes = xml.toRuneArray()
var buf = Array<Byte>(bytes.size, { _ => UInt8(0) })
for (i in 0..bytes.size - 1) {
    buf[i] = UInt8(UInt32(bytes[i]) & 0xFF)
}
File.writeTo(path, buf)
```

先通过 `toRuneArray()` 拿到 Rune 数组，再逐个转为 Byte。`UInt32(bytes[i]) & 0xFF` 取低 8 位，对 ASCII 范围的 XML 字符完全够用。

### Array 构造需要初始化函数

`Array<Byte>(size)` 不能只传大小，必须提供初始化函数：`Array<Byte>(size, { _ => UInt8(0) })`。

## 三、验证：3 个测试，134/134 全绿

```
[ PASSED ] testWriteToStringDict
[ PASSED ] testWriteToStringArray
[ PASSED ] testWriteToStringContainsXmlHeader
Summary: TOTAL: 134, PASSED: 134, FAILED: 0
```

---

**下一篇**：翻译 `ASCIIPropertyListWriter`——ASCII 格式写出器。
