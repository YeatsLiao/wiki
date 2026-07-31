# 第 23 篇：翻译 PropertyListParser——plist 类型检测

> 本系列第 23 篇。上一篇完成了 `XMLLocationInformation`。这一篇翻译 `PropertyListParser` 的骨架——442 行的解析门面类，先实现可独立测试的 `determineType` 类型检测。

## 一、PropertyListParser 是什么

解析器门面类，负责：
1. 检测 plist 数据类型（XML / Binary / ASCII）
2. 分派到对应子解析器
3. 提供 deprecated 的 save/convert 便捷方法

## 二、翻译策略

### 跳过 Java I/O 依赖

上游大量使用 `InputStream`、`File`、`Path`、`BufferedInputStream` 等 Java I/O 类。仓颉版改为基于 `Array<Byte>` 和文件路径。

### 直接字节比较替代字符串解码

上游先读 magic bytes，解码为字符串，再检查前缀。仓颉版直接在字节层面比较——所有 magic 字符（`<`、`(`、`{`、`/`、`bplist`）都是 ASCII，UTF-8 和 UTF-16-BE 下可直接识别，无需解码。

### match case 的陷阱

仓颉的 `match case` 中，`case CONSTANT_NAME` 会被当作**变量绑定**（把匹配值赋给新变量），而非**常量比较**。解决方案：用 if-else 链代替。

### parse 方法留 TODO

三个子解析器（XML/Binary/ASCII Parser）尚未翻译，`parse` 方法暂留注释占位。

## 三、验证：11 个测试，155/155 全绿

```
[ PASSED ] testDetermineTypeXml
[ PASSED ] testDetermineTypeBinary
[ PASSED ] testDetermineTypeAsciiDict
[ PASSED ] testDetermineTypeAsciiArray
[ PASSED ] testDetermineTypeAsciiComment
[ PASSED ] testDetermineTypeBlank
[ PASSED ] testDetermineTypeEmpty
[ PASSED ] testDetermineTypeUnknown
[ PASSED ] testDetermineTypeWithUtf8Bom
[ PASSED ] testDetermineTypeWithWhitespaceBeforeBinary
[ PASSED ] testGetTypeName
Summary: TOTAL: 155, PASSED: 155, FAILED: 0
```

**下一篇**：翻译 `PropertyListConverter`。
