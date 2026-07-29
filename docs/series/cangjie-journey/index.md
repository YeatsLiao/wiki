# 仓颉小白的三方库共建之旅

> 一个编程小白，从「完全看不懂活动」到「亲手把一个开源库移植到仓颉语言」的完整记录。
>
> 本系列如实记录我参与 **「仓颉三方库共建计划」** 的全过程——踩过的坑、想通的点、每一步怎么做。写给和我一样的新手，也写给未来的自己。

---

## 这个系列是关于什么的？

2026 年，我报名参加了华为仓颉（Cangjie）生态的 **「三方库共建计划」**，认领了一个叫 `dd-plist` 的库。

问题是：**我是个仓颉小白，连这个活动是做什么的都没搞明白。**

于是我决定，一边学一边做，把整个过程完整记录下来，整理成这个系列。如果你也是新手，跟着这个系列走，应该能少走很多弯路。

## 我的起点（真实情况）

- ✅ 有一点点编程基础，但**完全没接触过仓颉语言**
- ❓ 不知道「三方库共建」是什么意思
- ❓ 不知道认领的 `dd-plist` 是做什么的
- ❓ 不知道怎么把一个 Java 库变成仓颉库
- 💻 系统：Windows

如果你和我情况差不多，欢迎跟着一起走。

## 文章目录

### 第一部分：准备篇（第 1-5 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 1 篇 | [读懂「仓颉三方库共建计划」](./01-读懂仓颉三方库共建计划.md) | 这个活动到底在做什么、我要做什么、完整流程 |
| 第 2 篇 | [搭建仓颉开发环境](./02-搭建仓颉开发环境.md) | 怎么在 Windows 上装好仓颉、怎么验证装成功了 |
| 第 3 篇 | [认识 dd-plist：它到底是个什么库](./03-认识dd-plist这个库.md) | plist 是什么、这个库解决什么问题 |
| 第 4 篇 | [通读源码，规划移植路线](./04-源码通读与移植规划.md) | 怎么读懂一个陌生代码库、按什么顺序翻译 |
| 第 5 篇 | [搭建工程，翻出第一段能跑的代码](./05-搭建工程翻译第一个模块.md) | 用 cjpm 搭工程、仓颉包与目录规则、翻译第一个模块并 build/test 跑通 |

### 第二部分：叶子类型篇（第 6-11 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 6 篇 | [推代码上远端，翻译 NSObject 与 NSString](./06-翻译NSObject与NSString.md) | 该推哪个分支、大类怎么拆着翻、翻译前先查 API、用方法替代反射 |
| 第 7 篇 | [翻译 NSNumber：被关键字、NaN、溢出教育的一课](./07-翻译NSNumber.md) | type 关键字冲突、match 常量坑、数值转换抛异常、std.convert 解析 |
| 第 8 篇 | [翻译 NSData：字节数组与 Base64 的双面人生](./08-翻译NSData.md) | 字节数组构造、Base64 编解码、文件读取、GnuStep 扩展 |
| 第 9 篇 | [翻译 NSDate：时间格式的大杂烩](./09-翻译NSDate.md) | XML/GnuStep 双格式解析、DateTime 构造、跨格式兼容 |
| 第 10 篇 | [翻译 UID：小类也有大坑](./10-翻译UID.md) | BigInteger 替代方案、字节填充、十六进制输出 |
| 第 11 篇 | [翻译 NSNull：最简单的类，最不简单的单例](./11-翻译NSNull.md) | wrap/unwrap 模式、单例实现、序列化抛异常 |

### 第三部分：容器类型篇（第 12-14 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 12 篇 | [翻译 NSArray：ArrayList 的仓颉翻译](./12-翻译NSArray.md) | 容器类型移植、NSObject 比较与克隆、仓颉 sort 用法 |
| 第 13 篇 | [翻译 NSDictionary：HashMap 在仓颉里怎么活](./13-翻译NSDictionary.md) | HashMap 替代、containsValue 五种重载、CDATA 输出 |
| 第 14 篇 | [翻译 NSSet：没有 HashSet 的日子](./14-翻译NSSet.md) | 手动去重、ArrayList+线性查找、序列化委托 NSArray |

### 第四部分：工具与写出器篇（第 15-23 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 15 篇 | [翻译 BinaryLocationInformation](./15-翻译BinaryLocationInformation.md) | 位置信息子类、offset/id 字段 |
| 第 16 篇 | [翻译 ASCIILocationInformation](./16-翻译ASCIILocationInformation.md) | line/column 追踪 |
| 第 17 篇 | [翻译 ParsedObjectStack：解析期的对象栈](./17-翻译ParsedObjectStack.md) | 栈结构、对象 ID 去重 |
| 第 18 篇 | [翻译 ByteOrderMarkReader：BOM 检测](./18-翻译ByteOrderMarkReader.md) | UTF-8/16/32 BOM 识别、多字节读取 |
| 第 19 篇 | [翻译 XMLPropertyListWriter](./19-翻译XMLPropertyListWriter.md) | XML 输出、缩进控制、CDATA 处理 |
| 第 20 篇 | [翻译 ASCIIPropertyListWriter](./20-翻译ASCIIPropertyListWriter.md) | ASCII 格式输出、GnuStep 扩展 |
| 第 21 篇 | [翻译 BinaryPropertyListWriter：最复杂的写出器](./21-翻译BinaryPropertyListWriter.md) | 对象 ID 分配、交叉引用、偏移量表、trailer 写入 |
| 第 22 篇 | [翻译 XMLLocationInformation](./22-翻译XMLLocationInformation.md) | XPath 位置追踪 |
| 第 23 篇 | [翻译 PropertyListParser：格式自动检测](./23-翻译PropertyListParser.md) | BOM 检测、magic bytes 分派、格式常量 |

### 第五部分：解析器篇（第 24-26 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 24 篇 | [翻译 BinaryPropertyListParser：二进制解析](./24-翻译BinaryPropertyListParser.md) | 二进制格式头解析、对象表遍历、偏移量计算 |
| 第 25 篇 | [翻译 XMLPropertyListParser：手写 XML 递归下降](./25-翻译XMLPropertyListParser.md) | 仓颉无 XML DOM、手写逐字符解析器、标签状态机 |
| 第 26 篇 | [翻译 ASCIIPropertyListParser：手写 ASCII 递归下降](./26-翻译ASCIIPropertyListParser.md) | 无引号值类型推断、转义序列状态机、GnuStep 扩展 |

### 第六部分：收尾篇（第 27-31 篇）

| 篇章 | 标题 | 你会搞懂 |
|------|------|----------|
| 第 27 篇 | [收尾：双版本验证、文档补齐与 PR 提交](./27-收尾：双版本验证、文档补齐与PR提交.md) | SDK 共存解压、cjpm 缓存清理、bundle 打包、OpenSSL 兼容性、文档规范、PR 模板 |
| 第 28 篇 | [PR 审核整改：把测试覆盖率从 64% 提到 81%](./28-PR审核整改与测试覆盖率提升.md) | cjcov 工具链、`@OverflowWrapping` 溢出修复、双版本覆盖率报告、只统计生产源码 |
| 第 29 篇 | [数据类覆盖率攻坚：从 81% 冲到 97%](./29-数据类覆盖率攻坚与两个BOM截断bug.md) | 精准补测方法、两个 UTF-8 BOM 截断 Bug、`as` 不是上转型、NSDate 喂 Inf/NaN 死循环 |
| 第 30 篇 | [第二轮审核整改：16 个问题点、2 个一票否决，到 PR 合并](./30-第二轮审核整改与PR合并.md) | 文档即契约、统一入口补齐、上游回归测试揪出 3 个真 Bug、复审说明怎么写 |
| 第 31 篇 | [发布到仓颉中心仓：cjlint 的突袭与一个缺失的 DLL](./31-发布到仓颉中心仓.md) | cjpm bundle/publish 流程、cjlint MANDATORY 三类违规修法、OpenSSL 3 DLL 硬编码依赖、发布令牌安全 |

---

## 项目成果

经过 31 篇文章的完整记录，`plist4cj` 项目已全部完成：

| 指标 | 数据 |
|------|------|
| 移植模块 | 13 个类 + 3 个解析器 + 3 个写出器 |
| 单元测试 | **309/309 PASSED** |
| 行覆盖率 | **97.26%（2875/2956，仅生产源码）** |
| LTS 1.0.5 验证 | ✅ 309/309 |
| STS 1.1.3 验证 | ✅ 309/309 |
| PR 状态 | ✅ 两轮审核整改后**已合并** |
| 中心仓发布 | ✅ [plist4cj 1.0.1](https://pkg.cangjie-lang.cn/package/plist4cj) 已上架，`plist4cj = "1.0.1"` 即可引用 |
| 共建文章 | 31 篇 |
| 当前状态 | 🟢 **项目主线完结** |

## 一句话总结这件事

> **「三方库共建」= 把一个用别的语言写好的开源库，用仓颉语言重新实现一遍，丰富仓颉的生态。**
>
> 我认领的 `dd-plist` 是一个处理苹果 `.plist` 配置文件的 Java 库，我的任务就是把它变成仓颉版的 `plist4cj`。

---

*本系列主线已完结。如果对你有帮助，欢迎分享给同样想入门仓颉的朋友。*
