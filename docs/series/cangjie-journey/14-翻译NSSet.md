# 第 14 篇：翻译 NSSet——当 HashSet 不可用时的替代方案

> 本系列第 14 篇。容器类型三连的最后一篇。`NSSet` 看起来最简单，但它带来了一个根本性问题：NSObject 不能用 HashSet。

---

## 一、NSSet 是什么

`NSSet` 是 `NSObject` 的集合容器，支持无序和有序两种模式，对齐 Apple Foundation 的 NSSet。上游 `NSSet.java` 有 328 行。

核心功能：

- 构造：无序 / 有序两种模式
- 操作：`addObject` / `removeObject` / `containsObject` / `member` / `anyObject`
- 集合运算：`intersectsSet` / `isSubsetOfSet`
- 序列化：`toXML` / `toASCII` / `toASCIIGnuStep`（全部委托给 NSArray）
- 对象方法：`clone` / `equals` / `compare` / `hashCode`

## 二、核心设计决策：ArrayList + 手动去重

上游 Java 版使用 `LinkedHashSet` / `TreeSet` 作为底层存储。但仓颉的 `HashSet<T>` 要求 `T` 实现 `Hashable & Equatable` 接口，而 `NSObject` 基类没有实现这两个接口。

**根本原因**：`NSObject` 没有 `equals` 方法（各子类各自实现），也没有 `hashCode`（在基类层面）。所以 NSObject 无法满足 Hashable / Equatable 的约束。

**解决方案**：用 `ArrayList<NSObject>` + 手动去重：

```cangjie
public class NSSet <: NSObject {
    private var list: ArrayList<NSObject>
    private var ordered: Bool

    public func addObject(obj: NSObject): Unit {
        if (!this.containsObject(obj)) {
            this.list.add(obj)
        }
    }
}
```

性能上不如 HashSet 的 O(1)，但对于 plist 解析场景，集合通常很小，O(n) 的线性查找完全可以接受。

## 三、翻译要点

### 静态工厂方法

Java 版有多个构造函数。仓颉不支持命名构造器，改用静态工厂方法：

```cangjie
public static func of(objects: Array<NSObject>): NSSet {
    let s = NSSet()
    for (o in objects) {
        s.addObject(o)
    }
    s
}

public static func of(objects: Array<NSObject>, ordered: Bool): NSSet {
    let s = NSSet(ordered)
    for (o in objects) {
        s.addObject(o)
    }
    s
}
```

### NSObject 的相等判断

`containsObject` 需要判断两个 NSObject 是否"相等"。不能直接用 `equals`（基类没有），也不能直接 `compare`（不同类型比较可能出错）。

解决方案：先用 `typeId` 判断类型是否相同，再用 `compare` 比较值：

```cangjie
private static func nsoEquals(a: NSObject, b: NSObject): Bool {
    if (typeId(a) != typeId(b)) {
        return false
    }
    a.compare(b) == Ordering.EQ
}

private static func typeId(o: NSObject): Int64 {
    match (o) {
        case _: NSString => 1
        case _: NSNumber => 2
        case _: NSData => 3
        case _: NSDate => 4
        case _: UID => 5
        case _: NSNull => 6
        case _: NSArray => 7
        case _: NSDictionary => 8
        case _: NSSet => 9
        case _ => 0
    }
}
```

这个 `typeId` 模式确保了：不同类型一定不相等，同类型才比较值。避免了 NSString 和 NSNumber 之间意外"相等"的问题。

### 序列化委托给 NSArray

NSSet 在 plist 格式中没有自己的表示方式，XML 和 ASCII 输出全部委托给 NSArray：

```cangjie
protected func toXML(xml: StringBuilder, level: Int64): Unit {
    NSArray(this.allObjects()).toXML(xml, level)
}

protected func toASCII(ascii: StringBuilder, level: Int64): Unit {
    NSArray(this.allObjects()).toASCII(ascii, level)
}
```

有序集合在输出前会先排序：

```cangjie
public func allObjects(): Array<NSObject> {
    if (this.ordered) {
        let arr = this.list.toArray()
        NSSet.sortNSObjects(arr)
        arr
    } else {
        this.list.toArray()
    }
}
```

## 四、踩坑实录

### 坑 1：不能用 HashSet

这是最核心的设计决策。仓颉的 `HashSet<T>` 有类型约束 `T <: Hashable & Equatable`，NSObject 不满足。尝试直接使用会报类型约束不满足的编译错误。

退而求其次，用 ArrayList + 线性查找 + 手动去重。

### 坑 2：nsoEquals 的嵌套 match 问题

最初尝试在 match case 里嵌套 match 来做类型分派：

```cangjie
// ❌ 编译报错——内层 { } 被解析为 lambda
private static func nsoEquals(a: NSObject, b: NSObject): Bool {
    match (a) {
        case sa: NSString => {
            match (b) {
                case sb: NSString => sa.equals(sb)
                case _ => false
            }
        }
        // ... 更多类型
    }
}
```

外层 match case 的 `{ }` 被解析为 lambda。最终改用 `typeId` 方案——先比较类型 ID，同类型再 compare，完全避免了嵌套 match。

### 坑 3：默认参数值不支持

Java 版构造函数有无参和带参两个版本。最初尝试：

```cangjie
// ❌ 仓颉不支持默认参数值
public init(ordered: Bool = false) { ... }
```

仓颉不支持默认参数值语法。改为两个 init 重载：

```cangjie
public init() {
    this.list = ArrayList<NSObject>()
    this.ordered = false
}

public init(ordered: Bool) {
    this.list = ArrayList<NSObject>()
    this.ordered = ordered
}
```

## 五、验证：14 个测试，110/110 全绿

```
[ PASSED ] testEmptySet
[ PASSED ] testAddAndContains
[ PASSED ] testAddDuplicate      // 去重验证
[ PASSED ] testRemoveObject
[ PASSED ] testAllObjects
[ PASSED ] testAnyObject         // 空集返回 NSNull
[ PASSED ] testMember            // 找到返回对象，未找到返回 NSNull
[ PASSED ] testIntersectsSet
[ PASSED ] testIsSubsetOf
[ PASSED ] testClone
[ PASSED ] testEquals            // 顺序不同但元素相同 → 相等
[ PASSED ] testCompare
[ PASSED ] testXmlOutput         // 委托给 NSArray
[ PASSED ] testOfFactory         // 工厂方法 + 去重
Summary: TOTAL: 110, PASSED: 110, FAILED: 0
```

## 六、这一步的收获

1. **NSObject 不能用 HashSet**：仓颉的 HashSet 要求 Hashable & Equatable，NSObject 不满足。用 ArrayList + 手动去重替代。
2. **typeId 分派模式**：嵌套 match 不可行时，用类型 ID 函数先判断类型是否一致，再调用 compare。简洁且避免了 lambda 陷阱。
3. **不支持默认参数值**：用多个 init 重载代替。
4. **序列化委托**：NSSet 没有独立的 plist 表示，输出全部委托给 NSArray。

---

**容器类型三连完成！** 至此，9 种 NSObject 子类全部翻译完毕：

| 类型 | 行数 | 测试数 | 状态 |
|------|------|--------|------|
| NSString | 156 | 6 | ✅ |
| NSNumber | 250 | 8 | ✅ |
| NSData | 200 | 13 | ✅ |
| NSDate | 180 | 12 | ✅ |
| UID | 150 | 14 | ✅ |
| NSNull | 102 | 10 | ✅ |
| NSArray | 278 | 14 | ✅ |
| NSDictionary | 369 | 16 | ✅ |
| NSSet | 286 | 14 | ✅ |
| **合计** | | **110** | **全绿** |

下一篇将进入解析器模块——`PropertyListParser`，这是整个库的核心入口。
