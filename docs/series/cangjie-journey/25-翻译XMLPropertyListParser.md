# 第 25 篇：翻译 XMLPropertyListParser——手写 XML 递归下降解析器

> 本系列第 25 篇。上一篇完成了 `BinaryPropertyListParser`。这一篇翻译 `XMLPropertyListParser`，由于仓颉标准库没有 XML DOM API，我们手写了一个 XML 递归下降解析器，过程中踩了不少坑。

---

## 一、为什么不能直接翻译

上游 Java 版 `XMLPropertyListParser` 基于 `javax.xml.parsers.DocumentBuilderFactory` 构建 DOM 树，然后遍历 `Node` 节点递归解析。核心代码大约 545 行，严重依赖 Java DOM API：

```java
Document doc = dbf.newDocumentBuilder().parse(new ByteArrayInputStream(data));
NodeList children = doc.getChildNodes();
// ... 遍历 Node，按 nodeName 分派
```

仓颉标准库**没有 XML DOM 解析能力**，也没有等价 SAX 框架。评估后决定：**手写一个简单的 XML 递归下降解析器**，只支持 plist 所需的标签子集。

## 二、设计思路

### 数据源：`Array<Rune>` 而非 `String`

仓颉的 `String[index]` 返回 `Byte`（UTF-8 字节），不是字符。为了逐字符扫描，先将整个输入转为 `Array<Rune>`：

```cangjie
private var src: Array<Rune> = []
private var pos: Int64 = 0
```

### 核心状态

| 字段 | 用途 |
|------|------|
| `src` | 输入字符数组 |
| `pos` | 当前扫描位置 |
| `lineNo` / `colNo` | 行列号，用于错误定位 |
| `lastSelfClosed` | 最近一次 `readStartTag()` 是否读到自闭合 `/>` |

### 公开 API

```cangjie
public static func parse(data: Array<Byte>): NSObject
public static func parseFile(path: String): NSObject
```

## 三、关键方法

### `readStartTag()`——消费完整开标签

这是整个解析器最核心的方法。它必须消费 `<`、标签名、所有属性、以及闭合的 `>` 或 `/>`：

```cangjie
private func readStartTag(): String {
    this.skipWSAndComments()
    // 检查 '<' 且排除 '</'、'<!'、'<?'
    this.advance(1) // skip '<'
    let name = this.readName()
    this.lastSelfClosed = false
    while (this.pos < this.src.size) {
        this.skipWS()
        let c = this.ch(this.pos)
        if (c == r'>') { this.advance(1); break }
        if (c == r'/' && ...) { this.advance(2); this.lastSelfClosed = true; break }
        this.skipAttrValue()  // 跳过属性名和值
    }
    name
}
```

用 `lastSelfClosed` 实例变量记录是否自闭合，调用方据此决定是否需要读 `</endTag>`。

### `doParseElement()`——按标签分派

```cangjie
if (tag == "dict") { return this.doParseDict(xpath) }
if (tag == "array") { return this.doParseArray(xpath) }
if (tag == "integer") {
    let text = this.readTextContent()
    this.readEndTag("integer")
    return NSNumber(text)
}
// ... string / real / date / data / true / false
```

### `doParseDict()` / `doParseArray()`——容器递归

dict 循环读 `<key>` + 值元素，array 循环读子元素。由于仓颉 `Array` 没有 `push`，array 采用预分配 + 手动扩容 + 最终拷贝到精确大小数组的模式。

### `readEntityInto()`——XML 实体解码

支持 `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` 以及 `&#NNN;` `&#xHH;` 数字实体。由于仓颉 `String` 没有 `substring`，实体名称通过逐字符比较识别：

```cangjie
if (nameLen == 3 && this.ch(start) == r'a' && this.ch(start+1) == r'm' && this.ch(start+2) == r'p') {
    sb.append(r'&')
    return
}
```

## 四、踩坑记录

### 坑 1：双推进 bug

**症状**：5 个测试全部失败，报 `Unknown plist XML tag: <>`（空标签名）。

**原因**：`advance(n)` 内部已调用 `advancePos()` 递增 `this.pos`，但代码中同时写了 `this.pos = this.pos + N; this.advance(N)`，导致位置前进了 **2N**。

```cangjie
// 错误写法 —— 位置跳了 2 倍
this.pos = this.pos + 2
this.advance(2)

// 正确写法
this.advance(2)
```

**教训**：封装了 `advance(n)` 就**不要**再手动改 `this.pos`，二者只能选其一。

### 坑 2：`readStartTag()` 不消费闭合 `>`

**症状**：3 个测试失败，字符串值带前导 `>`（如 `">alpha"` 而非 `"alpha"`）。

**原因**：早期版本的 `readStartTag()` 读完标签名就返回，没有消费 `>` 和属性。后续 `readTextContent()` 把 `>` 当成了文本内容的一部分。

**修复**：重构 `readStartTag()` 使其消费完整的开标签（属性 + `>` 或 `/>`），用 `lastSelfClosed` 标记是否自闭合。

### 坑 3：`match case { }` 被解析为 lambda

仓颉的 `match` 表达式中，`case "dict" => { ... }` 的花括号被解析为 lambda 而非语句块。最终改用 if-else 链分派。

### 坑 4：`Array` 没有 `push`

仓颉 `Array` 是固定大小的，没有动态追加方法。array 解析采用预分配 16 个元素 + 满时翻倍扩容 + 最终拷贝到精确大小数组：

```cangjie
var items = Array<NSObject>(16, { _ => NSNull.wrap(None) })
// ... 满时扩容
var newItems = Array<NSObject>(items.size * 2, { _ => NSNull.wrap(None) })
// 拷贝 ...
items = newItems
// 最终拷贝到精确大小
```

## 五、字节编码处理

`bytesToString()` 支持 UTF-8（含 BOM）、UTF-16-BE、UTF-16-LE 三种编码。UTF-16 的代理对（surrogate pair）也做了处理：

```cangjie
if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF && i + 1 < data.size) {
    // 读低代理项，组合成完整码点
    let cp = 0x10000 + (codeUnit - 0xD800) * 0x400 + (low - 0xDC00)
    sb.append(Rune(UInt32(cp)))
}
```

## 六、测试

5 个 round-trip 测试（构造对象 → 生成 XML → 解析 → 验证）：

| 测试 | 内容 |
|------|------|
| testParseSimpleDict | 3 键字典（字符串、整数、布尔） |
| testParseArray | 3 元素字符串数组 |
| testParseNestedDict | 嵌套字典 |
| testParseData | NSData Base64 编解码 |
| testParseBooleans | true/false 布尔值 |

全部 **165/165** 测试通过。

---

下一篇翻译最后一个解析器 `ASCIIPropertyListParser`。
