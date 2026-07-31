# 第 13 篇：翻译 NSDictionary——HashMap 与类型分派的艺术

> 本系列第 13 篇。上一篇完成了 `NSArray`，这一篇轮到字典容器 `NSDictionary`。它带来了新的挑战：containsValue 的多类型重载，以及元组访问的语法差异。

## 一、NSDictionary 是什么

`NSDictionary` 是以字符串为键、`NSObject` 为值的字典容器，对齐 Apple Foundation 的 NSDictionary。上游 `NSDictionary.java` 有 508 行，是到目前为止最大的类之一。

核心功能：

- 构造：空字典
- 存取：`put` / `objectForKey` / `remove` / `clear`
- 查询：`containsKey` / `containsValue`（5 种类型重载）/ `allKeys` / `size` / `isEmpty`
- 序列化：`toXML`（含 CDATA 处理）/ `toASCII` / `toASCIIGnuStep`
- 对象方法：`clone` / `equals` / `compare` / `hashCode`

内部使用 `HashMap<String, NSObject>` 作为底层存储。

## 二、翻译要点

### 内部存储与基本操作

```cangjie
public class NSDictionary <: NSObject {
    private var dict: HashMap<String, NSObject>

    public init() {
        this.dict = HashMap<String, NSObject>()
    }

    public func objectForKey(key: String): Option<NSObject> {
        this.dict.get(key)
    }

    public func containsKey(key: String): Bool {
        this.dict.contains(key)
    }
}
```

### put 方法的 Option 处理

上游的 `put(String, NSObject)` 返回旧值。仓颉版用 `Option<NSObject>` 封装：

```cangjie
public func put(key: String, obj: Option<NSObject>): Option<NSObject> {
    match (obj) {
        case Some(value) => NSDictionary.putImpl(this, key, value)
        case None => this.dict.get(key)
    }
}

private static func putImpl(self_: NSDictionary, key: String, value: NSObject): Option<NSObject> {
    let old = self_.dict.get(key)
    self_.dict.add(key, value)
    old
}
```

注意 `putImpl` 提取为静态方法——又是 match case `{ }` 的 lambda 陷阱。

### containsValue 的多类型重载

上游有 5 个 `containsValue` 重载：NSObject / NSString / int / double / boolean。仓颉版全部保留，但实现方式需要调整：

```cangjie
// NSObject 版本——用 compare
public func containsValue(val: NSObject): Bool {
    for (v in this.dict.values()) {
        if (v.compare(val) == Ordering.EQ) {
            return true
        }
    }
    return false
}

// NSString 版本——类型判断 + 转型
public func containsStringValue(val: String): Bool {
    for (v in this.dict.values()) {
        if (nsoIsNSString(v) && (v as NSString).getOrThrow().getContent() == val) {
            return true
        }
    }
    return false
}

// NSNumber 整数版本
public func containsIntValue(val: Int64): Bool {
    for (v in this.dict.values()) {
        if (nsoIsNSNumber(v) && (v as NSNumber).getOrThrow().isInteger()
            && (v as NSNumber).getOrThrow().longValue() == val) {
            return true
        }
    }
    return false
}
```

**为什么不用 match case？** 又是 `{ }` lambda 陷阱。如果在 for 循环里用 match case + 多语句块，就会触发编译错误。所以改用类型判断辅助函数 `nsoIsNSString` / `nsoIsNSNumber` + `as` 转型的单表达式 if。

### 元组访问：`entry[0]` / `entry[1]`

`HashMap.toArray()` 返回 `Array<(String, NSObject)>`，元素是元组。Java 用 `entry.getKey()` / `entry.getValue()`，仓颉用下标访问：

```cangjie
for (entry in this.dict.toArray()) {
    let key = entry[0]    // 不是 entry.0
    let value = entry[1]  // 不是 entry.1
    // ...
}
```

### XML 输出中的 CDATA 处理

键名可能包含 `&`、`<`、`>` 等 XML 特殊字符，需要用 CDATA 包裹：

```cangjie
if (key.contains("&") || key.contains("<") || key.contains(">")) {
    xml.append("<![CDATA[")
    xml.append(key.replace("]]>", "]]]]><![CDATA[>"))
    xml.append("]]>")
} else {
    xml.append(key)
}
```

## 三、踩坑实录

### 坑 1：又是 match case `{ }` lambda 陷阱

`put` 方法里的 match case 需要多语句逻辑（先 get 旧值，再 add，再返回旧值）。直接写在 case 右侧的 `{ }` 会被解析为 lambda。

解决方案：提取为 `putImpl` 静态方法。这已经是第三次用这个模式了——`compareWithArray`、`putImpl`、`compareWithDict`。**这个模式在容器类型翻译中是通用的。**

### 坑 2：containsValue 不能用 match 分派类型

最初尝试在 `containsStringValue` 里用 match 判断值类型：

```cangjie
// ❌ 编译报错
for (v in this.dict.values()) {
    match (v) {
        case s: NSString => {
            if (s.getContent() == val) { return true }
        }
        case _ => {}
    }
}
```

`{ }` 又被解析为 lambda。改为 `nsoIsNSString(v) && (v as NSString).getOrThrow().getContent() == val` 的单行 if 表达式。

### 坑 3：`Array<String>()` 初始化

`allKeys()` 需要把 Collection 转为 Array。最初尝试各种方式，最终用 `concat` 拼接：

```cangjie
public func allKeys(): Array<String> {
    let keysColl = this.dict.keys()
    var keysArr = Array<String>()
    for (k in keysColl) {
        keysArr = keysArr.concat([k])
    }
    keysArr
}
```

## 四、验证：16 个测试，110/110 全绿

```
[ PASSED ] testPutAndGet
[ PASSED ] testSize
[ PASSED ] testContainsKey
[ PASSED ] testContainsValue
[ PASSED ] testContainsStringValue
[ PASSED ] testContainsIntValue
[ PASSED ] testContainsBoolValue
[ PASSED ] testRemove
[ PASSED ] testAllKeys
[ PASSED ] testIsEmpty
[ PASSED ] testClone
[ PASSED ] testEquals
[ PASSED ] testCompare
[ PASSED ] testXmlOutput
[ PASSED ] testClassName
[ PASSED ] testPutNoneNoOp
```

## 五、这一步的收获

1. **元组访问用 `entry[0]` / `entry[1]`**：仓颉不是 Java 的 `.0` / `.1`。
2. **containsValue 多类型重载**：用类型判断辅助函数 + `as` 转型代替 match 分派，避免 `{ }` lambda 陷阱。
3. **XML CDATA 处理**：键名含特殊字符时需要 CDATA 包裹，`]]>` 本身也需要转义。
4. **put 的 Option 语义**：传入 None 时不修改字典，只返回旧值——这和 Java 版行为一致。

**下一篇**：翻译 `NSSet`——无法使用 HashSet 的集合，以及 NSObject 相等判断的终极方案。
