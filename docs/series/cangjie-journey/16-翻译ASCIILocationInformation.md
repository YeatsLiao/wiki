# 第 16 篇：翻译 ASCIILocationInformation——三行数据也能成篇

> 本系列第 16 篇。上一篇完成了 `BinaryLocationInformation`，这一篇是它的"兄弟"——`ASCIILocationInformation`，同样简单，47 行。

## 一、ASCIILocationInformation 是什么

与 `BinaryLocationInformation` 类似，但记录的是 **ASCII plist 文件**中的位置：偏移量（offset）、行号（lineNo）、列号（column）。

## 二、翻译要点

直译即可，三个字段 + 三个 getter + `getDescription()`：

```cangjie
public class ASCIILocationInformation <: LocationInformation {
    private var offset: Int64
    private var lineNo: Int64
    private var column: Int64

    public init(offset: Int64, lineNo: Int64, column: Int64) {
        this.offset = offset
        this.lineNo = lineNo
        this.column = column
    }

    public func getOffset(): Int64 { this.offset }
    public func getLineNumber(): Int64 { this.lineNo }
    public func getColumnNumber(): Int64 { this.column }

    public func getDescription(): String {
        "Line: " + this.lineNo.toString() + ", Column: " + this.column.toString()
            + ", Offset: " + this.offset.toString()
    }
}
```

## 三、踩坑实录

无坑。唯一要注意的是构造器参数名和字段名一致，别写错赋值语句。

## 四、验证：4 个测试，118/118 全绿

```
[ PASSED ] testGetOffsetLineColumn
[ PASSED ] testGetDescription
[ PASSED ] testToString
[ PASSED ] testZeroValues
Summary: TOTAL: 118, PASSED: 118, FAILED: 0
```

**下一篇**：翻译 `ParsedObjectStack`——二进制解析器的循环引用检测栈。
