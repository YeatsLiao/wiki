# RXTX 中文文档

## 项目简介

RXTX 是一个为 Java 提供跨平台串行端口（Serial Port）和并行端口（Parallel Port）访问的开源库。

> 💡 **什么是串口？** 串口是计算机上一种传统的通信接口（如 COM1、COM2），常用于连接单片机、仪器仪表、工业设备等。RXTX 让 Java 程序能够与这些设备通信。

## 如何访问

- **在线文档**：[https://yeatsliao.github.io/rxtx-docs-cn/](https://yeatsliao.github.io/rxtx-docs-cn/)
- **GitHub 仓库**：[https://github.com/YeatsLiao/rxtx-docs-cn](https://github.com/YeatsLiao/rxtx-docs-cn)

## 文档目录

### 入门

| 文档 | 说明 |
|-----|------|
| [📖 项目简介](ProjectOverview.md) | RXTX 是什么、支持平台、许可证概览 |
| [🚀 安装指南](INSTALL.md) | 构建、安装、常见问题 FAQ（26 条） |
| [🔌 串口使用教程](SerialPortInstructions.md) | 查找端口、权限配置、Java 代码示例 |

### 参考

| 文档 | 说明 |
|-----|------|
| [🔧 移植指南](Porting.md) | 向新平台移植 RXTX 的方法 |
| [🖥️ 支持的构建主机](wiki/SupportedBuildHosts.md) | 各平台构建兼容性矩阵 |
| [📋 变更日志](ChangeLog.md) | v0.1 → v2.2 完整历史 |
| [❓ 常见问题](wiki/FAQ.md) | 常见问题及解答 |
| [🛠️ 开发指南](wiki/Development.md) | 开发者参考资料 |
| [📥 下载资源](wiki/Download.md) | 源代码和预编译二进制包 |

### 关于

| 文档 | 说明 |
|-----|------|
| [👥 贡献者名单](AUTHORS.md) | 所有参与 RXTX 开发的开发者 |
| [⚖️ 许可证摘要](LicenseSummary.md) | LGPL v2.1 + 受控接口例外说明 |
| [📜 完整许可证](FullLicense.md) | GNU LGPL v2.1 全文中文翻译 |

## 主要特性

- **跨平台支持**：支持 Linux、Windows、Mac OS、Solaris、FreeBSD、HP-UX 等多种操作系统
- **完整 CommAPI 实现**：遵循 Sun 的 [Java Communications API](https://docs.oracle.com/cd/E17802_01/products/products/javacomm/reference/api/)（简称 CommAPI）规范，提供 `gnu.io` 包的实现
- **串口和并口支持**：同时支持 RS232 串口通信和并口打印
- **事件通知**：支持串口事件监听（数据到达、载波检测、线路状态变化等）
- **流控支持**：支持硬件流控（RTS/CTS）和软件流控（XON/XOFF）
- **LGPL 许可证**：基于 GNU LGPL v2.1 开源发布，允许在各种项目中免费使用

## 官方资源

- **官方网站**：http://www.rxtx.org
- **源码仓库**：https://github.com/rxtx/rxtx
- **邮件列表**：Majordomo@hex.linuxgrrls.org（发送 "subscribe rxtx" 订阅）

## 翻译说明

- 基于 RXTX 2.2（development 分支）
- 许可证以英文原版为准
- 欢迎提交 Issue 改进翻译

---

*本项目由 [YeatsLiao](https://github.com/YeatsLiao) 维护。*
