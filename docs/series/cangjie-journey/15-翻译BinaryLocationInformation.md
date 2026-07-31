# 第 15 篇：翻译 BinaryLocationInformation——进入解析器基础设施

> 本系列第 15 篇。9 种 NSObject 子类全部完成后，今天开始进入解析器/写出器模块。第一个是 `BinaryLocationInformation`——只有 38 行的位置信息数据类。

## 一、BinaryLocationInformation 是什么

`BinaryLocationInformation` 是 `LocationInformation` 的子类，描述 NSObject 在**二进制 plist 文件**中的位置。上游只有 38 行，包含：

- 两个字段：`id`（对象 ID）和 `offset`（文件内偏移）
- 一个构造器
- `getId()` / `getOffset()` 访问器
- `getDescription()` 返回格式化字符串

同类还有 `ASCIILocationInformation`（ASCII plist 位置）和 `XMLLocationInformation`（XML plist 位置）。它们都继承自已翻译的 `LocationInformation` 抽象类。

## 二、翻译要点

### 继承 LocationInformation

上游 `extends LocationInformation`，仓颉对应 `<: LocationInformation`：

```cangjie
public class BinaryLocationInformation <: LocationInformation {
    private var id: Int64
    private var offset: Int64

    public init(id: Int64, offset: Int64) {
        this.id = id
        this.offset = offset
    }

    public func getDescription(): String {
        "Object ID: " + this.id.toString() + ", Offset: " + this.offset.toString()
    }
}
```

因为 `LocationInformation` 是抽象类，只有一个抽象方法 `getDescription()`，实现它就行。`toString()` 已经在基类里实现了（直接调用 `getDescription()`），不需要重写。

### int → Int64

上游用 Java `int`，仓颉统一用 `Int64`。这和之前翻译其他类型时的选择一致。

## 三、踩坑实录

这个类太简单了，没有坑。直译即可。

## 四、验证：4 个测试，114/114 全绿

```
[ PASSED ] testGetIdAndOffset
[ PASSED ] testGetDescription
[ PASSED ] testToString
[ PASSED ] testZeroValues
Summary: TOTAL: 114, PASSED: 114, FAILED: 0
```

## 五、这一步的收获

1. **LocationInformation 继承链很顺畅**：抽象基类已经翻译好，子类只需实现 `getDescription()`。
2. **解析器基础设施开始搭建**：位置信息类是解析器的辅助类型，用于记录解析出的对象在源文件中的位置。

**下一篇**：翻译 `ASCIILocationInformation`——ASCII plist 的位置信息。
