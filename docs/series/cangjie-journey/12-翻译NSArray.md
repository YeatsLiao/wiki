# 第 12 篇：翻译 NSArray——第一个容器类型的挑战

> 本系列第 12 篇。叶子类型全部完成，从今天开始进入容器类型。`NSArray` 是第一个——它不像叶子类型那样"翻译就行"，而是带来了三个全新的仓颉语言挑战。

---

## 一、NSArray 是什么

`NSArray` 是 `NSObject` 元素的有序数组，对齐 Apple Foundation 的 NSArray。上游 `NSArray.java` 有 375 行，提供：

- 两种构造：指定大小（填充 NSNull）/ 指定元素数组
- 存取：`objectAtIndex` / `setValue` / `remove` / `lastObject`
- 搜索：`containsObject` / `indexOfObject` / `objectsAtIndexes`
- 序列化：`toXML` / `toASCII` / `toASCIIGnuStep`
- 对象方法：`clone` / `equals` / `compare` / `hashCode`

内部使用 `ArrayList<NSObject>` 作为底层存储。

## 二、翻译要点

### 内部存储

Java 版用 `ArrayList<NSObject>`，仓颉版完全对应：

```cangjie
public class NSArray <: NSObject {
    private var array: ArrayList<NSObject>

    public init(length: Int64) {
        this.array = ArrayList<NSObject>()
        for (_ in 0..length) {
            this.array.add(NSNull.wrap(None))
        }
    }

    public init(elements: Array<NSObject>) {
        this.array = ArrayList<NSObject>()
        for (e in elements) {
            this.array.add(e)
        }
    }
}
```

### 搜索用 `compare` 而非 `equals`

因为 `NSObject` 基类没有 `equals` 方法，所有搜索操作都用 `compare(obj) == Ordering.EQ` 判断相等：

```cangjie
public func containsObject(obj: NSObject): Bool {
    for (elem in this.array) {
        if (elem.compare(obj) == Ordering.EQ) {
            return true
        }
    }
    return false
}
```

### ASCII 输出的换行决策

`writeASCII` 方法需要判断当前元素是否为容器类型（NSDictionary / NSArray / NSData），以决定是否换行。这需要一个类型判断辅助方法：

```cangjie
private static func isASCIIContainerType(o: NSObject): Bool {
    match (o) {
        case _: NSDictionary => true
        case _: NSArray => true
        case _: NSData => true
        case _ => false
    }
}
```

## 三、踩坑实录

### 坑 1：match case 的 `{ }` 被解析为 lambda

这是容器类型带来的第一个大坑。仓颉的 match case 如果右侧是多语句块 `{ ... }`，编译器会把它解析为 lambda 而不是代码块。

比如 `compare` 方法：

```cangjie
// ❌ 编译报错——{ } 被解析为 lambda
public func compare(that: NSObject): Ordering {
    match (that) {
        case other: NSArray => {
            // 多语句比较逻辑...
        }
        case _ => this.getClassName().compare(that.getClassName())
    }
}
```

**解决方案**：把多语句逻辑提取为独立的静态方法：

```cangjie
// ✅ 正确
public func compare(that: NSObject): Ordering {
    match (that) {
        case other: NSArray => NSArray.compareWithArray(this, other)
        case _ => this.getClassName().compare(that.getClassName())
    }
}

private static func compareWithArray(self_: NSArray, other: NSArray): Ordering {
    if (other.count() != self_.count()) {
        return self_.count().compare(other.count())
    }
    for (i in 0..self_.array.size) {
        let a = NSNull.wrap(Some(self_.array.get(i).getOrThrow()))
        let b = NSNull.wrap(Some(other.array.get(i).getOrThrow()))
        let diff = a.compare(b)
        if (diff != Ordering.EQ) {
            return diff
        }
    }
    Ordering.EQ
}
```

这个"提取静态方法"的模式在三个容器类型中反复使用——`compareWithArray`、`compareWithDict`、`compareWithSet`、`putImpl`。

### 坑 2：`NSObject` 没有 `hashCode`

容器类型的 `hashCode` 需要累加元素的哈希值。但 `NSObject` 基类没有声明 `hashCode` 方法，不能对 `NSObject` 类型的变量调用 `.hashCode()`。

**解决方案**：创建 `NSObjectHash` 辅助类，通过 match 类型分派到各子类的 hashCode：

```cangjie
public class NSObjectHash {
    public static func hashCode(o: NSObject): Int64 {
        match (o) {
            case s: NSString => s.hashCode()
            case n: NSNumber => n.hashCode()
            case d: NSData => d.hashCode()
            case d: NSDate => d.hashCode()
            case u: UID => u.hashCode()
            case _: NSNull => Int64(0)
            case a: NSArray => a.hashCode()
            case d: NSDictionary => d.hashCode()
            case s: NSSet => s.hashCode()
            case _ => Int64(0)
        }
    }
}
```

### 坑 3：`String.lastIndexOf` 返回 `Option<Int64>`

`writeASCII` 中需要查找最后一个换行符的位置。Java 的 `lastIndexOf` 返回 `int`，仓颉的返回 `Option<Int64>`：

```cangjie
// Java: int idx = str.lastIndexOf("\n");
// 仓颉：
var indexOfLastNewLine: Int64 = 0
match (ascii.toString().lastIndexOf(NSObject.NEWLINE)) {
    case Some(idx) => indexOfLastNewLine = idx
    case None => indexOfLastNewLine = 0
}
```

### 坑 4：`sort()` 方法已废弃

`objectsAtIndexes` 需要对索引数组排序。最初写 `indexes.sort()`，编译器提示已废弃。正确用法是全局函数：

```cangjie
let sorted = indexes.clone()
sort(sorted)  // 全局函数，不是方法
```

## 四、验证：14 个测试，110/110 全绿

针对构造、存取、增删、搜索、clone、equals、compare、XML 输出等都写了用例：

```
[ PASSED ] testConstructWithSize
[ PASSED ] testConstructWithElements
[ PASSED ] testSetAndGetValue
[ PASSED ] testRemove
[ PASSED ] testLastObject
[ PASSED ] testContainsObject
[ PASSED ] testIndexOfObject
[ PASSED ] testObjectsAtIndexes
[ PASSED ] testClone
[ PASSED ] testEquals
[ PASSED ] testCompare
[ PASSED ] testXmlOutput
[ PASSED ] testClassName
[ PASSED ] testGetArray
Summary: TOTAL: 110, PASSED: 110, FAILED: 0
```

## 五、这一步的收获

1. **match case 多语句必须提取方法**：仓颉的 `{ }` 在 match case 右侧会被解析为 lambda，不是代码块。解决方案是提取为静态方法。
2. **NSObject 没有 hashCode**：容器类型需要 hashCode 时，用 `NSObjectHash` 辅助类做类型分派。
3. **`sort()` 是全局函数**：仓颉的排序用全局 `sort(arr)` 而不是 `arr.sort()`。
4. **`lastIndexOf` 返回 Option**：需要 match 解包。

---

**下一篇**：翻译 `NSDictionary`——键值对容器，以及更多类型分派技巧。
