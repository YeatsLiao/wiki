# 第 11 篇：翻译 NSNull——最简单的单例，以及"没有 NullPointerException"

> 本系列第 11 篇。上一篇翻完了 `UID`。这一篇轮到 `NSNull`——整个 dd-plist 里最简单的类，只有 102 行。但即便这么简单，也踩了两个坑：仓颉没有 `final class`，也没有 `NullPointerException`。

## 一、NSNull 是什么

`NSNull` 是 null 值的内部表示，**用于在 NSDictionary / NSSet 等容器中存储 null**。因为仓颉的 `Option<T>` 已经能表示"有值/无值"，但 plist 的容器类型需要一个具体的对象来占位。

上游 `NSNull.java` 提供：

- 私有构造 + 静态单例 `NULL`
- `wrap(NSObject)` / `unwrap(NSObject)`：null ↔ NSNull 互转
- `clone()` 返回自身
- `toXML` / `toASCII` / `toASCIIGnuStep` 全部抛 `NullPointerException`
- `equals` / `compareTo`

整体 102 行，是到目前为止最简单的类。

## 二、翻译要点

### 单例模式

上游用 `private static final NSNull NULL = new NSNull()` + 私有构造。仓颉版直接对应：

```cangjie
private static let NULL: NSNull = NSNull()
private init() {}
```

### wrap / unwrap

上游的 `wrap` / `unwrap` 操作的是 Java 的 `null` 引用。仓颉用 `Option<NSObject>` 来表达"可能为空"：

```cangjie
// wrap: Option<NSObject> → NSObject
public static func wrap(o: Option<NSObject>): NSObject {
    match (o) {
        case Some(obj) => obj
        case None => NSNull.NULL
    }
}

// unwrap: NSObject → Option<NSObject>
public static func unwrap(o: NSObject): Option<NSObject> {
    match (o) {
        case _: NSNull => None
        case _ => Some(o)
    }
}
```

`unwrap` 用类型匹配 `case _: NSNull` 判断是否为 NSNull 实例，比调用 `equals` 更直接。

## 三、踩坑实录

### 坑 1：仓颉没有 `final class`

Java 的 `NSNull` 声明为 `public final class`，防止被继承。仓颉没有 `final` 关键字——直接写 `public class` 就行。如果需要防止继承，可以用私有构造来实现（本例已经这么做了）。

```java
// Java
public final class NSNull extends NSObject { ... }
```

```cangjie
// 仓颉（没有 final）
public class NSNull <: NSObject & Hashable { ... }
```

### 坑 2：没有 `NullPointerException`

上游的 `toXML` / `toASCII` / `toASCIIGnuStep` 抛 `java.lang.NullPointerException`。仓颉标准库没有这个异常类。最接近的替代是 `IllegalArgumentException`——语义上也说得通："你不该对一个 null 值调用序列化方法"。

```cangjie
// 上游 Java
throw new NullPointerException("A null value cannot be represented...");

// 仓颉版
throw IllegalArgumentException("A null value cannot be represented...")
```

### 坑 3：`NSObject` 没有 `equals` / `hashCode`

测试时想对 `NSNull.wrap()` 的返回值（类型是 `NSObject`）调用 `equals` 和 `hashCode`，但 `NSObject` 基类没有声明这两个方法。解决方案：先转型为 `NSNull` 再调用。

```cangjie
// 错误：NSObject 没有 equals
let a = NSNull.wrap(None)
a.equals(Some(b))  // 编译报错

// 正确：先转型
let nullObj = (NSNull.wrap(None) as NSNull).getOrThrow()
nullObj.equals(Some(other))  // OK
```

## 四、验证：10 个测试，66/66 全绿

针对 wrap/unwrap、clone、equals、compare、hashCode、className、toXML 抛异常都写了用例：

```
[ PASSED ] testWrapNone
[ PASSED ] testWrapSome
[ PASSED ] testUnwrapNSNull
[ PASSED ] testUnwrapNonNSNull
[ PASSED ] testClone
[ PASSED ] testEquals
[ PASSED ] testCompare
[ PASSED ] testHashCode
[ PASSED ] testClassName
[ PASSED ] testToXMLThrows
Summary: TOTAL: 66, PASSED: 66, FAILED: 0
```

## 五、这一步的收获

1. **仓颉没有 `final class`**：如果需要防止实例化，用私有构造代替。
2. **仓颉没有 `NullPointerException`**：用 `IllegalArgumentException` 替代，语义上也合理。
3. **`NSObject` 基类没有 `equals` / `hashCode`**：这些方法由各子类自行实现，测试时需要先转型到具体类型。
4. **`unwrap` 用类型匹配比 `equals` 更直接**：`match (o) { case _: NSNull => ... }` 不需要依赖 equals 方法。

**下一篇（待更新）**：叶子类型全部完成！接下来进入容器类型——`NSArray`。
