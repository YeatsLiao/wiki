# 第 22 篇：翻译 XMLLocationInformation——跳过 SAX，简化构造

> 本系列第 22 篇。上一篇完成了 `BinaryPropertyListWriter`。这一篇翻译 `XMLLocationInformation`——XML 节点位置信息，97 行。同时评估跳过了 `XMLLocationFilter`（依赖 Java SAX API）。

---

## 一、XMLLocationInformation 是什么

记录 NSObject 在 XML plist 文件中的位置：XPath 路径、行号、列号。上游的构造器接受 `org.w3c.dom.Node`，从 DOM 属性中提取 SAX 过滤器写入的行列信息。

## 二、翻译要点

### 跳过 XMLLocationFilter

`XMLLocationFilter` 继承 `XMLFilterImpl`（Java SAX API），在 XML 解析时注入行列信息到属性中。仓颉没有 SAX 框架，无法直接翻译。评估后决定跳过，留待 XML 解析器翻译时一并处理。

### 简化构造器

既然 `XMLLocationFilter` 不存在，`XMLLocationInformation` 的 DOM Node 构造器也无法使用。改为直接传入 xpath、行号、列号：

```cangjie
public init(xpath: String, lineNo: Int64, column: Int64)
public init(xpath: String)  // 无行列信息
```

公共 API 保持不变：`getXPath()`、`getLineNumber()`、`getColumnNumber()`、`hasLineInformation()`、`getDescription()`。

## 三、验证：4 个测试，144/144 全绿

```
[ PASSED ] testGetXpathLineColumn
[ PASSED ] testGetDescription
[ PASSED ] testNoLineInformation
[ PASSED ] testToString
Summary: TOTAL: 144, PASSED: 144, FAILED: 0
```

---

**下一篇**：翻译 `ByteOrderMarkFilterInputStream`。
