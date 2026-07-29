# 第 20 篇：翻译 ASCIIPropertyListWriter——上提公共方法消除重复

> 本系列第 20 篇。上一篇完成了 `XMLPropertyListWriter`。这一篇翻译 `ASCIIPropertyListWriter`——ASCII plist 写出器，168 行。

---

## 一、ASCIIPropertyListWriter 是什么

上游提供两组重载：
- `write(NSDictionary/NSArray, File/Path)`：Apple ASCII 格式
- `writeGnuStep(NSDictionary/NSArray, File/Path)`：GnuStep ASCII 格式

核心逻辑已经在各 NSObject 子类的 `toASCII`/`toASCIIGnuStep` 中实现，Writer 只是薄封装。

## 二、翻译要点

### 上提 toASCIIPropertyList 到 NSObject

上游在 NSArray 和 NSDictionary 中各自定义了 `toASCIIPropertyList()` 和 `toGnuStepASCIIPropertyList()`，代码完全相同。仓颉版中，我把这两个方法上提到 NSObject 基类（与 `toXMLPropertyList()` 同级），然后从 NSArray 和 NSDictionary 中删除重复定义。

```cangjie
// NSObject.cj
public func toASCIIPropertyList(): String {
    let ascii = StringBuilder()
    this.toASCII(ascii, 0)  // 多态分派到子类
    ascii.append(NSObject.NEWLINE)
    ascii.toString()
}
```

由于 `toASCII` 是 protected 抽象方法，各子类各自实现，基类调用时自动走多态分派，效果与子类各自定义完全一致。

### 仓颉版 API

```cangjie
ASCIIPropertyListWriter.writeApple(root, path)        // Apple 格式写文件
ASCIIPropertyListWriter.writeGnuStep(root, path)      // GnuStep 格式写文件
ASCIIPropertyListWriter.writeAppleToString(root)      // Apple 格式转字符串
ASCIIPropertyListWriter.writeGnuStepToString(root)    // GnuStep 格式转字符串
```

## 三、验证：3 个测试，137/137 全绿

```
[ PASSED ] testWriteAppleToStringDict
[ PASSED ] testWriteAppleToStringArray
[ PASSED ] testWriteGnuStepToString
Summary: TOTAL: 137, PASSED: 137, FAILED: 0
```

---

**下一篇**：翻译 `BinaryPropertyListWriter`——二进制格式写出器。
