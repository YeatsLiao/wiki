# 支持的构建主机

> 本文档为 RXTX 官方 Wiki 中 "Supported Build Hosts" 页面的中文翻译版本。

## 概述

下表列出了哪些构建主机可以为目标系统生成二进制文件：

- **构建主机**：编译过程运行的系统
- **目标平台**：生成的二进制文件可以执行的目标系统

> ⚠️ **重要提示**：基于 Maven 的构建流程目前仍在开发阶段。使用此流程构建的二进制文件**目前尚不能工作**，适用于**所有平台**。这是因为 Java 库加载器需要更新以适配新的构建系统。请耐心等待。

## 构建兼容性矩阵

| 目标平台 ↓ / 构建主机 → | **Linux** | **Windows** | **Mac OS** |
|------------------------|-----------|-------------|------------|
| **Linux x86** | ✅ | ✅ | ❌ |
| **Linux x86_64** | ✅ | ✅ | ❌ |
| **Linux arm** | ✅ | ❌ | ❌ |
| **Windows x86** | ✅ | ✅ | ❌ |
| **Windows x86_64** | ✅ | ✅ | ❌ |
| **Mac OS x86_64** | ❌ | ❌ | ✅ |

## 说明

### ✅ 已验证可工作的组合

- **Linux x86** 作为构建主机可以构建 Linux x86、x86_64、arm 的二进制文件
- **Linux x86_64** 作为构建主机可以构建 Linux x86_64、Windows x86 和 x86_64 的二进制文件
- **Windows** 构建主机可以构建 Windows x86 和 x86_64 的二进制文件
- **Mac OS x86_64** 作为构建主机可以构建 Mac OS x86_64 的二进制文件

### ❌ 不支持的组合

- 从 Linux 构建 Mac OS 二进制文件（不支持）
- 从 Mac OS 构建 Linux 或 Windows 二进制文件（不支持）
- 从 Linux x86_64 构建 Linux x86 二进制文件（不支持）
- 从 Linux arm 构建任何平台的二进制文件（暂不支持）

## 相关资源

- 完整安装说明请参阅：[INSTALL.md](../INSTALL.md)
- 跨平台编译指南请参阅：[INSTALL.md#2-7-windows-平台编译](../INSTALL.md#_2-7-windows-平台编译)

*本页面翻译自 RXTX 官方 Wiki。*
*原文地址：https://github.com/rxtx/rxtx/wiki/Supported-Build-Hosts*
