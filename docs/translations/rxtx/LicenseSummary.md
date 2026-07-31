# RXTX 许可证

> 本文档为 RXTX 官方 COPYING 文件的中文翻译摘要版。
>
> **完整版请参阅**：[FullLicense.md](FullLicense.md) — 包含 RXTX 许可证全文 + GNU LGPL v2.1 全文中文翻译
>
> 在线参考：
> - [GNU LGPL v2.1 英文全文](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html)
> - [GNU LGPL v2.1 中文参考](https://www.gnu.org/licenses/old-licenses/lgpl-2.1.cn.html)

## RXTX 许可证 v2.1

**RXTX 许可证 v2.1 - LGPL v2.1 + 受控接口链接例外**

- RXTX 是 Java 的跨平台原生串口接口
- 版权所有：1997-2012 by Trent Jarvi tjarvi@qbang.org 及所有实际参与贡献的开发者

## 核心条款

### 自由使用

RXTX 是一款**自由软件**：

- ✅ 你可以自由地**再分发**本软件
- ✅ 你可以自由地**修改**本软件
- ✅ 允许在修改后的版本上添加例外（见下方说明）

### LGPL v2.1 条款

根据 GNU LGPL v2.1 许可证：

1. **库本身自由**：你可以再分发和修改本库
2. **无保修**：本库按"原样"提供，不提供任何明示或暗示的保证
3. **闭源链接例外**：通过受控接口（Sun Microsystem CommAPI）与 RXTX 通信的独立模块，可以采用任何许可证发布

### 受控接口例外（重要）

作为特殊例外，RXTX 版权持有者允许你：

> 将 RXTX 与独立模块（通过 Sun Microsystem CommAPI 接口版本 2 与 RXTX 通信）链接，生成的作品可以采用你选择的任何许可证发布。

**前提条件**：
- 作品的每一份副本都必须附带 RXTX 完整源代码
- 作品必须按照 LGPL + 此例外条款分发

### 独立模块

> 独立模块是指：不衍生自 RXTX 或不基于 RXTX 构建的模块。

### 修改版本的例外

> 对 RXTX 进行修改的开发者，**没有义务**为其修改版本授予此例外。

## 关键区别：RXTX vs 普通 LGPL 库

普通 LGPL 库要求：
- 如果你修改并发布库本身，修改版也必须开源

RXTX 的例外：
- ✅ 使用 RXTX 编写的应用程序可以是闭源的
- ✅ 应用程序可以采用任何许可证
- ✅ 只需要附带 RXTX 源代码

## 许可证摘要

| 场景 | 许可证要求 |
|-----|-----------|
| 仅使用 RXTX 库开发应用 | 应用可以是**闭源** |
| 修改 RXTX 库本身 | 修改版本必须开源 |
| 分发 RXTX 库 | 必须附带 LGPL 许可证 |
| 分发使用 RXTX 的应用 | 必须附带 RXTX 源代码 |

## 第三方商标

所有商标归其各自所有者所有。

## 联系方式

- 许可证问题请联系：RXTX 维护者
- 项目主页：http://www.rxtx.org
- GitHub：https://github.com/rxtx/rxtx

## 完整许可证

GNU LGPL v2.1 完整英文版本可在以下网址找到：

- https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

*本摘要由 RXTX 中文社区翻译整理，仅供参考。*
*以英文原版许可证为准。*
