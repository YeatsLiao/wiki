# 第 21 篇：翻译 BinaryPropertyListWriter——二进制序列化与 IEEE 754 的坑

> 本系列第 21 篇。上一篇完成了 `ASCIIPropertyListWriter`。这一篇翻译 `BinaryPropertyListWriter`——二进制 plist 写出器，370 行。

## 一、BinaryPropertyListWriter 是什么

这是最复杂的写出器。它将 NSObject 树序列化为 Apple 的二进制 plist 格式（bplist00）。流程：
1. 写 magic（`bplist00`）
2. 为每个对象分配唯一 ID
3. 依次写出每个对象的二进制表示
4. 写偏移表（offset table）
5. 写 trailer（含对象数、根对象 ID、偏移表位置等）

需要所有 NSObject 子类配合实现 `assignIDs` 和 `toBinary` 两个方法。

## 二、翻译要点

### 用字节数组替代 OutputStream

上游基于 `OutputStream`，仓颉版改为 `Array<Byte>` 缓冲，最终通过 `File.writeTo` 写出。需要手动管理缓冲扩容。

### 用平行数组模拟 LinkedHashMap

上游用 `LinkedHashMap<NSObject, Integer>` 存储对象到 ID 的映射。仓颉没有等价类型，用两个平行数组 `idKeys`/`idVals` + `idCount` 计数器模拟。查找时线性遍历比较。

### 为所有 NSObject 子类添加二进制支持

需要在 9 个文件中添加代码：
- `NSObject.cj`：添加 `assignIDs`（open）和 `toBinary`（abstract）
- `NSString/NSNumber/NSData/NSDate/UID/NSNull`：实现 `toBinary`
- `NSArray/NSDictionary/NSSet`：实现 `assignIDs`（递归子对象）和 `toBinary`

### Float64 转 Int64 位模式

上游用 `Double.doubleToRawLongBits(value)`。仓颉没有这个 API，只能手动提取 IEEE 754 位模式：符号、指数、尾数。

## 三、踩坑实录

### 坑 1：`for (i in 0..n)` 在 Array 上不按预期工作

`for (i in 0..this.idCount - 1)` 遍历 `Array<NSObject>` 时，比较逻辑不生效。改用 `while` 循环后问题解决。

### 坑 2：`self` 不是仓颉关键字

Java 的 `self` 在仓颉里是 `this`。初稿中多处误用 `self`。

### 坑 3：`as` 转型返回 Option

`root as NSSet` 返回 `Option<NSSet>`，需要 `.getOrThrow()` 取值。

### 坑 4：`assignIDs` 需要 `open` 修饰

基类的 `assignIDs` 有默认实现但需要被子类覆盖，必须标记为 `protected open`。

## 四、验证：3 个测试，140/140 全绿

```
[ PASSED ] testWriteToArrayDict
[ PASSED ] testWriteToArrayArray
[ PASSED ] testWriteToArrayContainsTrailer
Summary: TOTAL: 140, PASSED: 140, FAILED: 0
```

**下一篇**：评估跳过 `XMLLocationFilter`（SAX 相关）和 `XMLLocationInformation`（DOM 相关）。
