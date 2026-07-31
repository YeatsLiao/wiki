# 第 26 篇：翻译 ASCIIPropertyListParser——最后一个解析器

> 本系列第 26 篇。上一篇完成了 XML 解析器。这一篇翻译 1090 行的 `ASCIIPropertyListParser`——最后一个解析器，支持 Apple 和 GnuStep 两种 ASCII plist 格式。

## 一、ASCIIPropertyListParser 概览

ASCII plist 是最"古老"的 plist 格式，形如：

```
{
    "Name" = "Hello";
    "Count" = 42;
    "Active" = YES;
}
```

上游 Java 版 1090 行，核心职责：

1. 递归下降解析：`{...}` 字典、`(...)` 数组、`<...>` 数据、`"..."` 引用字符串、无引号纯字符串
2. GnuStep 扩展：`<*BY>` / `<*BN>` 布尔、`<*D...>` 日期、`<*I...>` 整数、`<*R...>` 实数
3. 转义序列处理：`\\` `\"` `\n` `\t` `\uXXXX` `\0OO` 八进制等

## 二、翻译要点

### 数据源与 XML 解析器一致

同样使用 `Array<Rune>` 存储源文本，逐字符扫描。

### 无引号值的类型推断

ASCII 格式中，数字 `42`、布尔 `YES`/`NO` 都以无引号纯文本出现。解析器需要推断类型：

```cangjie
if (c >= r'0' && c <= r'9') {
    result = this.parseNumericOrDate()
} else {
    let s = this.parsePlainString()
    if (s == "YES") { result = NSNumber(true) }
    else if (s == "NO") { result = NSNumber(false) }
    else { result = NSString(s) }
}
```

`parseNumericOrDate()` 先检查日期格式（第 5 字符为 `-`），再尝试 `Int64.tryParse`，最后尝试 `Float64.tryParse`。

### GnuStep 扩展

`<...>` 标签内根据第二个字符分派：

| 前缀 | 含义 | 示例 |
|------|------|------|
| `*B` | 布尔 | `<*BY>` / `<*BN>` |
| `*D` | 日期 | `<*D2024-01-01 12:00:00>` |
| `*I` | 整数 | `<*I42>` |
| `*R` | 实数 | `<*R3.14>` |
| `[` | Base64 数据 | `<[SGVsbG8=]>` |
| 其他 | 十六进制数据 | `<DEADBEEF>` |

### 转义序列内联处理

上游用内部类 `EscapeSequenceHandler` 管理状态机。仓颉版用 `escapeState` 变量内联：

- `0` = 正常模式
- `1` = 十六进制 Unicode（`\uXXXX`，累积 4 个字符）
- `2` = 八进制（`\0OO`，累积 3 个字符）

```cangjie
if (escapeState == 1) {
    hexBuf.append(c)
    if (hexBuf.size == 4) {
        // 解析并追加 Rune
        escapeState = 0
    }
}
```

## 三、踩坑记录

### 坑 1：仓颉不支持 varargs

Java 的 `accept(char... symbols)` 在仓颉不能写成 `accept(runes: Rune...)`。改为 `Array<Rune>` 参数：

```cangjie
// Java: accept('a', 'b', 'c')
// 仓颉:
private func acceptSeq(runes: Array<Rune>): Bool { ... }
// 调用: this.acceptSeq([r'/', r'/'])
```

### 坑 2：无引号数字被当成字符串

`NSNumber(Int64(42))` 在 ASCII 中输出为 `42`（无引号）。解析时走 `parseDateString()` 路径，`NSDate("42")` 失败后回退为 `NSString("42")`，导致 round-trip 断。

修复：新增 `parseNumericOrDate()` 方法，先尝试 `Int64.tryParse` 和 `Float64.tryParse`，成功则返回 `NSNumber`。

### 坑 3：YES/NO 未识别为布尔

ASCII 格式中布尔值输出为 `YES`/`NO`（无引号），默认走 `parsePlainString()` 返回 `NSString`。需要在纯字符串分支中显式检查 `YES`/`NO` 并转为 `NSNumber`。

### 坑 4：match case `{ }` 再次出现

`parseNumericOrDate()` 中用 `match` + `case Some(v) => {}` 的空块被解析为 lambda。改为 `if (intVal.isSome())` 模式。

## 四、测试

5 个 round-trip 测试：

| 测试 | 内容 |
|------|------|
| testParseSimpleDict | 3 键字典（字符串、整数、布尔） |
| testParseArray | 3 元素字符串数组 |
| testParseNestedDict | 嵌套字典 |
| testParseFromString | 直接解析 ASCII 字符串 |
| testParseData | NSData 十六进制数据 |

全部 **170/170** 测试通过。

至此，三个解析器（Binary / XML / ASCII）全部翻译完成！下一步是反射胶水（`to/fromJavaObject`）和双版本验证。
