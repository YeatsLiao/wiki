# RXTX 项目贡献者

> 本文档为 RXTX 官方 AUTHORS 文件的中文翻译版本。
> 原文更新于：2007年11月18日

---

RXTX 不是一个人短时间完成的杰作。以下是所有为 RXTX 做出贡献的开发者（按字母顺序排列）：

## 核心贡献者

### Trent Jarvi（项目维护者）
- 邮箱：taj@www.linux.org.uk
- RXTX 项目发起者和主要维护者

### Wayne Roberts
- Win32 增强（大量工作）
- 读写超时、阈值、事件通知
- Linux 内核相关工作
- 使用专业分析设备验证 RXTX
- **贡献评语**：Wayne 对 RXTX 贡献巨大，没有他这个项目可能早就销声匿迹了。

### Douglas Lau
- RXTX 1.3 主要重写
- 多项修复和增强

### Dmitry Markman
- Mac OS X 使用 Code Warrior 构建和大量修复

---

## 平台移植贡献者

| 贡献者 | 贡献内容 |
|-------|---------|
| **Martin Oberhuber** | Eclipse 集成 RXTX 的多项修复 |
| **Stephane Cachat** | J2SE java.util.logging 和属性文件匹配 |
| **Sheikh, Awais** | HP-UX 端口枚举修复 |
| **Bill Smith** | QNX 端口 |
| **Michal Hobot** | WinCE 端口 |
| **Finbarr O'Kane** | True64 端口 |
| **Peter C. Verhage** | FreeBSD 修复 |
| **Jonathan Schilling** | UnixWare 和 OpenUNIX 端口 |
| **Joseph Goldstone** | Mac OS X 端口 |
| **Brian Hindman** | BeOS 端口（发起者和大部分实现工作） |
| **Stuart Anderson** | Free-BSD 端口 |
| **Ken Thompson** | Comtrol RocketPort 串口板支持 |
| **Holger Lehmann** | 打印机支持修复 |
| **Neil Darlow** | 流控修改和实现 |
| **Oliver Frommel** | IRIX 端口；修复了 open() 调用使 4/5/6/8/20 引脚无需连接 |
| **Michael Forte** | SunOS 端口 |
| **Gilles Paquet** | SunOS 端口 |
| **Kevin Hester** | CommAPI 支持，Linux Comm 项目 |
| **Karl Asha** | RXTX 网站托管（blackdown.org）；调试 autoconfig |

---

## 功能修复和改进贡献者

| 贡献者 | 贡献内容 |
|-------|---------|
| **Chris Portal + Joey Armstrong** | RS232 在 Linux 上的深度测试和调试 |
| **Bertrand Renuart** | 提供了 Java 端的 read() 方法，解决了许多问题 |
| **W. Craig Trader + Gareth Lee** | 在 `get_java_var` 和 `throw_java_exception` 函数中添加 `DeleteLocalRef` 调用，避免原生方法中内存耗尽的致命错误 |
| **Tim Groner** | 协助追踪 rxtx-1.3-10 中意外引入的 open() bug |
| **Alejandro P. Revilla** | 协助追踪 event_loop 竞态条件 |
| **Peter Bennett** | Moxa 串口板支持、Bug 追踪、简单读写示例 |
| **Martin Pool** | 支持显式指定的端口列表 |
| **David Atkinson** | 硬件事件处理实现；大量修复和贡献 |
| **Sheldon Young** | JCL/CommAPI 与 "javacomm20-ea" 的兼容性；大量修复和贡献 |
| **Joey Armstrong** | 在幕后将各方工作整合在一起的出色协调 |
| **Will Kassebaum** | rxtx.spec 相关工作 |
| **Yuen-Ping Leung** | FreeBSD 支持修复 |
| **Masayuki "Tencho" Yamashita** | 日语安装说明 |
| **Martin Pool** | 支持显式指定的端口列表 |
| **Karl Asha** | RXTX 网站托管（blackdown.org）；调试 autoconfig；提醒升级到 1.1.1 |
| **Oliver Frommel** | IRIX 端口；修复 open() 调用使 4/5/6/8/20 引脚无需短接；协助追踪阻止包正常工作的线程问题；多次建议；使用 RS232 分析仪验证串口通信 |

---

## 测试贡献者

| 贡献者 | 贡献内容 |
|-------|---------|
| **Melissa Pike** | RXTX 集成 QA 测试 |
| **Jauhar Ismail** | QA 测试 |
| **Scott Burleigh** | ThinkPad 串口行为文档和 "No serial ports found!" 问题说明 |

---

## 文档贡献

感谢所有为 RXTX 文档做出贡献的朋友！

---

## 如何参与贡献

如果你对 RXTX 进行了修改或发现了 bug，请将补丁反馈回来。

贡献者会被给予荣誉，除非明确要求不署名。

---

*完整的历史变更记录请参阅 [ChangeLog.md](ChangeLog.md)。*
