# 第 17 篇：翻译 ParsedObjectStack——不可变链表栈与循环引用检测

> 本系列第 17 篇。上一篇完成了 `ASCIILocationInformation`。这一篇翻译 `ParsedObjectStack`——二进制 plist 解析器用来检测循环引用的辅助类，70 行。

---

## 一、ParsedObjectStack 是什么

二进制 plist 中的对象可以相互引用，形成引用图。如果出现循环引用（A 引用 B，B 又引用 A），解析器需要检测并报错。`ParsedObjectStack` 就是这个检测工具——一个**不可变链表栈**。

上游用 Java 实现，核心设计：

- 私有构造 + 静态工厂 `empty()`
- `push(obj)` 不修改原栈，而是返回新节点
- 如果 push 的 ID 已在栈上，抛 `PropertyListFormatException`

## 二、翻译要点

### 不可变链表

```cangjie
public class ParsedObjectStack {
    private var parent: Option<ParsedObjectStack>
    private var object: Int64

    private init(parent: Option<ParsedObjectStack>, object: Int64) {
        this.parent = parent
        this.object = object
    }

    public static func empty(): ParsedObjectStack {
        ParsedObjectStack(None, -1)
    }

    public func push(obj: Int64): ParsedObjectStack {
        this.throwIfOnStack(obj)
        ParsedObjectStack(Some(this), obj)
    }
}
```

每次 push 创建新节点，`parent` 指向前一个节点。这是典型的函数式不可变数据结构。

### 递归检查

`throwIfOnStack` 递归遍历链表，检查 obj 是否已存在：

```cangjie
private func throwIfOnStack(obj: Int64): Unit {
    match (this.parent) {
        case Some(p) => ParsedObjectStack.checkAndRecurse(this, p, obj)
        case None => ()
    }
}

private static func checkAndRecurse(self_: ParsedObjectStack, p: ParsedObjectStack, obj: Int64): Unit {
    if (self_.object == obj) {
        throw PropertyListFormatException("...cyclic reference...")
    }
    p.throwIfOnStack(obj)
}
```

## 三、踩坑实录

### 坑 1：`case None => {}` 被解析为 lambda

空代码块 `{}` 在 match case 右侧也被解析为 lambda。解决方案：用 `()` 代替空操作。

```cangjie
// ❌ case None => {}  // 被解析为 lambda
// ✅ case None => ()  // Unit 字面量
```

### 坑 2：仓颉的 catch 语法

仓颉的 catch 语法是 `catch (e: ExceptionType)`，不是 Java 的 `catch (ExceptionType e)`。但更好的做法是用 `@ExpectThrows` 宏来测试异常。

## 四、验证：5 个测试，123/123 全绿

```
[ PASSED ] testEmptyStack
[ PASSED ] testPushSingle
[ PASSED ] testPushChain
[ PASSED ] testPushDuplicateThrows
[ PASSED ] testPushSameIdTwice
Summary: TOTAL: 123, PASSED: 123, FAILED: 0
```

---

**下一篇**：翻译 `ByteOrderMarkReader`——Unicode BOM 检测器。
