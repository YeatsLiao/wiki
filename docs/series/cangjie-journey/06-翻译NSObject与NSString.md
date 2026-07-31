# 第 6 篇：推代码上远端，翻译核心基类 NSObject 与第一个数据类型 NSString

> 本系列第 6 篇。上一篇搭好了工程、翻出了异常类。这一篇做两件事：把阶段成果推送到 fork 远端（搞清楚该推哪个分支），然后翻译整个库的「地基」——抽象基类 `NSObject`，以及第一个真正的数据类型 `NSString`。

## 一、先把代码推上远端：该推哪个分支？

官方帮我建好的 fork 仓库里有**两个分支**：

```
main                     # 开发主干
feat/plist4cj-1.1.3      # 另一个分支
```

一开始我不知道该推哪个。查了官方《双版本适配与提交指引》后想通了它的模型：

> **`main` 是开发主干、源码的唯一真相**；版本分支（如 `feat/plist4cj-1.1.3`）是**从 main 派生**、为对应版本打制品用的。

我们现在写的都是**版本中立的基础代码**，是整个库的地基，应该放在 `main`。所以顺序是「**先喂饱 main，再从它派生版本分支**」，不能反过来。

### 推送前踩的一个坑：别把 target/ 提交上去

`git status` 一看，暂存区里把整个 `target/`（编译产物）都加进去了。这些是构建输出，**绝对不能进仓库**。补一个 `.gitignore`：

```gitignore
target/
**/unittest_bin/
```

然后把已经误加的移出暂存区：

```bash
git rm -r --cached target
```

清理干净后再 `git push origin main`。

> 💡 小提醒：GitCode/AtomGit 用 HTTPS 推送要输入**访问令牌**（Personal Access Token），不是登录密码。

## 二、翻译 NSObject：整个库的抽象基类

`NSObject` 是 plist 里所有数据类型的共同父类，Java 版有 **723 行**。但它其实分成性质完全不同的两半：

| 部分 | 内容 | 现在能翻吗 |
|------|------|-----------|
| **A. 抽象骨架** | 常量、位置信息、抽象方法、缩进、`toXMLPropertyList` | ✅ 只依赖已翻的类 |
| **B. 二进制方法** | `toBinary`/`assignIDs` | ⏸ 依赖还没写的 writer |
| **C. 反射胶水** | `toJavaObject`/`fromJavaObject` 一大堆 | ⏸ 依赖所有类型 + 反射，最后 FFI 兜底 |

我的策略：**先只翻 A**，让基类能编译；B/C 在文件里用清晰的 `TODO` 标注「上游有、待补」——这不算砍功能，只是排后面，保证最终全量一致。

关键点是：抽象基类**只声明子类现在就能实现的抽象方法**（`clone`/`toXML`/`toASCII`/`toASCIIGnuStep`/`compare`），把有外部依赖的 `toBinary` 先不声明成抽象。这样接下来翻数据类型时不会被卡住。

### 坑：注释里的 `*/` 会提前闭合块注释

我在注释里写了 `deserialize*/from*`，`cjpm build` 直接报「非法字符」。原因是那个 `*/` 把 `/** ... */` 块注释提前闭合了，后面的中文就成了非法代码。把 `*/` 这种字符组合从注释里去掉就好。

### 坑：仓颉抽象方法不能是「包私有」

Java 里 `toXML` 是包私有的抽象方法。仓颉编译器报错：

```
error: the visibility of an 'abstract' function must be 'public' or 'protected'
```

改成 `protected` 即可（对子类可见，最接近原语义）。

## 三、翻译 NSString：第一个真正的数据类型

`NSString` 是字符串包装类，402 行。它是**具体类**，必须把 `NSObject` 的抽象方法**全部实现**。

### 先查 API，再动手

`toXML`/`toASCII` 要做字符转义、十六进制转换，涉及一堆字符串 API。为了少走弯路，我先在仓颉语料库里把要用的 API 全部确认了一遍：

- `StringBuilder` 有 `append(String)`、`append(Rune)`；
- `String` 有 `compare`、`contains`、`replace`、`toRuneArray`、`+` 拼接；
- `Comparable<T>` 继承 `Equatable`，但**操作符有默认实现**——所以只要实现 `compare`，`==`/`<`/`>` 都免费得到。

> 💡 这一步很值：**翻译前先确认目标语言的 API 是否存在、签名是什么样**，比写完一堆再被编译器逐条打回效率高得多。

### 一个跨语言差异：Java 反射 vs 仓颉

Java 的 `compareTo` 里，比较不同类型时用 `getClass().getName()` 拿类名。仓颉没有这种「万能反射」。我的处理：给 `NSObject` 加一个抽象方法 `getClassName()`，各子类返回自己的名字——**用一个明确的方法替代反射**。这也是后面处理 C 部分（反射胶水）的思路预演。

### 转义函数怎么翻

Java 的 `escapeStringForASCII` 逐字符处理，非 ASCII 字符转成 `\Uxxxx`。仓颉里用 `toRuneArray()` 遍历 `Rune`，用 `UInt32(rune)` 拿码点：

```cangjie
for (c in s.toRuneArray()) {
    let code = UInt32(c)
    if (code > 127) {
        out.append("\\U")
        // 转 4 位小写十六进制
    } else if (c == r'\\') {
        out.append("\\\\")
    } // ... 其余转义
}
```

还有个小惊喜：Java 的 `toXML` 里有一大段「把字符串重新编码成 UTF-8」的逻辑，仓颉里**完全不需要**——因为仓颉的 `String` 本身就只有 UTF-8 编码。这段可以直接省掉。

## 四、验证：build + test 全绿（9/9）

给 `NSString` 写了 6 个测试用例（内容存取、克隆独立性、比较、XML 输出、CDATA 包裹）。注意 `toXML`/`toASCII` 是 `protected`，测试包调不到，就通过公开的 `toXMLPropertyList()` 间接验证：

```
[ PASSED ] testContentAccessors
[ PASSED ] testCloneIndependent
[ PASSED ] testCompare
[ PASSED ] testXmlPlain / testXmlCdata
...
Summary: TOTAL: 9, PASSED: 9, FAILED: 0
```

`NSString` 作为第一个具体子类，把「实现全部抽象方法 + 真实输出 + 单测」的闭环完整跑通了，**说明 NSObject 的骨架切分是靠谱的**，后面的数据类型可以照这个套路批量推进。

## 五、这一步的收获

1. **分支模型**：main 是源码主干，版本分支从它派生——先喂饱 main。
2. **大类拆两半翻**：能编译的抽象骨架先翻，有外部依赖的部分用 `TODO` 排后面，不砍功能。
3. **翻译前先查 API**：确认目标语言有没有对应能力、签名如何，效率远高于盲翻。
4. **用明确方法替代反射**：Java 反射拿类名 → 仓颉加 `getClassName()` 抽象方法。
5. **利用语言特性省事**：仓颉 String 天生 UTF-8，省掉一整段重编码逻辑。

**下一篇（待更新）**：翻译数值类型 `NSNumber`（整数/浮点/布尔）与更多叶子类型，并适时做 LTS 1.0.5 + STS 1.1.3 的双版本验证。
