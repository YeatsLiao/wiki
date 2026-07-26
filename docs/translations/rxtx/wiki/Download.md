# RXTX 下载资源

> 本文档整合了 RXTX 的各种下载资源，包括源代码和预编译二进制包。

---

## 1. 源代码下载

### 1.1 GitHub 仓库

- **主仓库**：[https://github.com/rxtx/rxtx](https://github.com/rxtx/rxtx)
- **克隆命令**：
  ```bash
  git clone https://github.com/rxtx/rxtx.git
  ```

### 1.2 历史版本

- **官方网站**：http://www.rxtx.org
- **原始网站**：http://users.frii.com/jarvi/rxtx/

---

## 2. 预编译二进制包

### 2.1 Fizzed 预编译包

Fizzed 提供了 RXTX 的预编译二进制包，特别支持 64 位系统。这些二进制包基于最新的 CVS 快照构建，比官方网站上的版本更稳定。

**支持的平台：**
- Windows x86 (32位)
- Windows x64 (64位)
- Windows ia64
- Linux x86 (32位)
- Linux x86_64 (64位)

**下载链接：**
| 版本 | 文件名 | 下载链接 |
|------|--------|----------|
| RXTX-2-2-20081207 | Windows-x64 | [下载](https://bitbucket.org/jlauer/mfz-cdn/downloads/mfz-rxtx-2.2-20081207-win-x64.zip) |
| RXTX-2-2-20081207 | Windows-x86 | [下载](https://bitbucket.org/jlauer/mfz-cdn/downloads/mfz-rxtx-2.2-20081207-win-x86.zip) |
| RXTX-2-2-20081207 | Windows-ia64 | [下载](https://bitbucket.org/jlauer/mfz-cdn/downloads/mfz-rxtx-2.2-20081207-win-ia64.zip) |
| RXTX-2-2-20081207 | Linux-x86_64 | [下载](https://bitbucket.org/jlauer/mfz-cdn/downloads/mfz-rxtx-2.2-20081207-linux-x86_64.zip) |
| RXTX-2-2-20081207 | Linux-i386 | [下载](https://bitbucket.org/jlauer/mfz-cdn/downloads/mfz-rxtx-2.2-20081207-linux-i386.zip) |

**特点：**
- 基于最新的 CVS 快照构建
- 支持 64 位系统
- 使用 Microsoft Visual Studio 工具编译（Windows 版本）
- 测试通过的平台：
  - Windows：2008, 2003, Vista SP1
  - Linux：CentOS 5.0, 5.2

### 2.2 其他来源

- **Maven 仓库**：可以通过 Maven 依赖引入 RXTX
  ```xml
  <dependency>
      <groupId>org.rxtx</groupId>
      <artifactId>rxtx</artifactId>
      <version>2.2</version>
  </dependency>
  ```

---

## 3. 版本历史

### 主要版本：

| 版本 | 发布日期 | 主要变化 |
|------|----------|----------|
| 2.2 | 开发中 | 主要改进和 bug 修复 |
| 2.1 | 2008年 | 重大改进和新特性 |
| 1.5 | - | 稳定版本 |
| 1.4 | - | 早期版本 |

### 版本号格式：

RXTX 的版本号格式为 `RXTX-MAJOR.MINOR-PATCH`，例如 `RXTX-1.5-4`。

---

## 4. 下载说明

### 4.1 选择合适的版本

- **源代码**：适合需要自定义或修改 RXTX 的开发者
- **预编译二进制包**：适合直接使用 RXTX 的用户
  - 注意选择与你的 Java 版本（32位/64位）匹配的二进制包

### 4.2 安装步骤

**预编译二进制包安装：**

1. **下载对应平台的二进制包**
2. **解压文件**
3. **拷贝文件到指定目录**：

   **Windows 平台：**
   - 拷贝 `rxtxSerial.dll` → `<JAVA_HOME>\jre\bin`
   - 拷贝 `rxtxParallel.dll` → `<JAVA_HOME>\jre\bin`
   - 拷贝 `RXTXcomm.jar` → `<JAVA_HOME>\jre\lib\ext`

   **Linux 平台：**
   - 拷贝 `librxtxSerial.so` → `<JAVA_HOME>/jre/lib/i386/` (32位) 或 `<JAVA_HOME>/jre/lib/amd64/` (64位)
   - 拷贝 `librxtxParallel.so` → `<JAVA_HOME>/jre/lib/i386/` (32位) 或 `<JAVA_HOME>/jre/lib/amd64/` (64位)
   - 拷贝 `RXTXcomm.jar` → `<JAVA_HOME>/jre/lib/ext/`

4. **在项目中引入 RXTXcomm.jar**

### 4.3 验证安装

可以使用以下代码验证 RXTX 是否正确安装：

```java
import gnu.io.RXTXVersion;

public class RXTXVersionCheck {
    public static void main(String[] args) {
        System.out.println("RXTX 版本：" + RXTXVersion.getVersion());
        System.out.println("安装成功！");
    }
}
```

---

## 5. 相关资源

- [安装指南](../INSTALL.md)
- [串口使用教程](../SerialPortInstructions.md)
- [开发指南](./Development.md)
- [RXTX 官方 Wiki](http://rxtx.qbang.org/wiki/)

---

*本页面整合了 RXTX 的各种下载资源。*
