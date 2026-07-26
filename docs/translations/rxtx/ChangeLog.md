# RXTX 版本变更日志

> 本文档为 RXTX 官方 ChangeLog 的中文翻译版本。
> 翻译整理：RXTX 中文社区
> 基于版本：rxtx-2.2 (2012年6月6日)

---

## 版本 2.2

### 2012 年 6 月 6 日

- ✅ **修复回归问题**：自 2010年8月27日 以来系统属性注册串口功能失效
  - 作者：Martin Oberhuber <martin.oberhuber@windriver.com>
  - Bug: http://bugzilla.qbang.org/show_bug.cgi?id=196

- ✅ **修复回归问题**：Solaris 构建损坏
  - 作者：Martin Oberhuber <martin.oberhuber@windriver.com>
  - Bug: http://bugzilla.qbang.org/show_bug.cgi?id=195

- ✅ **新增**：LibraryLoader 类用于为库名添加后缀
  - 作者：Jeff Benjamin <jeff@ivertex.com>

- ✅ **修复**：创建的 Java 线程未标记为 daemon 线程
  - 作者：Christopher Wellons <mosquitopsu@gmail.com>

- ✅ **修复**：文件被锁定时防止崩溃
  - 作者：Michael Tandy <michaeltandy@googlemail.com>

- ✅ **修复**：Zystem 初始化失败时打印异常信息

- ✅ **改进**：移除了 Makefile 对 RXTXcomm.jar 的安装，消除了不必要的编译错误

- ✅ **修复**：sys/io.h 并非所有系统都有

- ✅ **修复**：Hurd 系统 - 定义 __GNU__ 以使用 FHS

- ✅ **修复**：BSD - kFreeBSD 上 libc_r 不可用，尝试 -DREENTRANT

- ✅ **改进**：改进端口枚举的调试信息

- ✅ **修复**：处理 "java.ext.dirs" 系统属性包含多个目录的情况

- ✅ **新增**：Makefile 添加 uninstall 目标

- ✅ **改进**：将 eis 移到堆内存，使其他函数在 eventLoop 返回时不会出问题；使用类型安全的函数获取 64 位值

- ✅ **修复**：使用原生工具在 Solaris 上编译
  - 作者：Martin Oberhuber

- ✅ **修复**：gnu.io.rxtx.properties 代码不工作的问题；修复 registerSpecifiedPorts 方法中的不安全代码
  - 作者：Adrian Crum <adrian.crum@yahoo.com>

- ✅ **新增**：Daemon Monitor 线程

- ✅ **改进**：loadLibrary 的 64位/32位 回退机制

- ✅ **大量改进**：重新生成了 JNI 头文件；更新了 nativeGetVersion() 返回的版本字符串；添加了 native_psmisc_report_owner()；添加了显式的 WCHAR 到 jchar 类型转换；调整了调试消息格式；用 IF_DEBUG() 包装了错误消息等

- ✅ **改进**：Windows 构建改进（MinGW32、MSVC、LCC）

- ✅ **改进**：文件 I/O 调用的返回值检查

- ✅ **改进**：移除未使用的 MATLAB 计时调试代码 (DEBUG_MW)

- ✅ **修复**：Linux 系统在没有 UTS_RELEASE (linux/utsrelease.h) 时的构建问题

- ✅ **新增**：Apple Xcode 3.x 项目文件

- ✅ **修复**：Windows 调试溢出修复 (YACK())

- ✅ **修复**：Windows 多端口修复

- ✅ **修复**：SIGSEGV at SerialImp.c (Solaris/mac/*bsd)

- ✅ **改进**：在 Windows 上显示哪个端口正在被使用

- ✅ **修复**：Windows 并口 WriteFile 问题

- ✅ **修复**：Solaris 静态 libgcc 链接

- ✅ **修复**：64 位 JNI 问题

- ✅ **修复**：setSerialPortParams 期间保持 DTR=false

- ✅ **修复**：避免 debug sprintf 溢出

- ✅ **修复**：禁用 dcb.fDtrControl 以避免意外行为

- ✅ **修复**：阈值问题

- ✅ **修复**：RXTX close deadlocks in RXTXPort.finalize

- ✅ **新增**：为所有已知端口添加 ACM 串口设备支持

- ✅ **修复**：SMP/多核系统的并发问题

- ✅ **修复**：MAC 系统无驱动时的处理；1.5 停止位修复

- ✅ **新增**：为 Mac OS X 启用通用库构建

- ✅ **修复**：不删除和忽略中断

- ✅ **新增**：在 Mac OS X 上检测程序启动后添加的端口

- ✅ **改进**：清理 CommPort 所有权代码，避免可能的死锁，修复丢失的 commport 所有权事件

- ✅ **修复**：JDK-1.6 编译问题

- ✅ **修复**：configure 脚本在 UTS_RELEASE 处失败

- ✅ **改进**：代码清理补丁

- ✅ **修复**：Linux ppc + glibc 2.5 编译问题（无 sys/io.h）

- ✅ **修复**：RXTX 覆盖 System 属性

- ✅ **新增**：Solaris ACM 端口支持

- ✅ **修复**：设置非标准波特率失败

- ✅ **修复**：RXTX 在 MacOS X 上使用锁文件（而不是 ioctl TIOCEXCL）

- ✅ **改进**：JavaDoc 修复

---

## 版本 2.1-7

### 2006 年 1 月 29 日

- Mac OS X x86/通用二进制文件和安装修复
- flush() 异常处理修复，使 close() 正常工作
- close() 性能修复
- 蓝牙支持
- writeByte 修复使 close 正常工作
- Configure.java 消息修正
- System.gc() 对 close() 性能影响过大

---

## 版本 2.1-6

### 2002 年 9 月 7 日

- read(byte) 不超时
- read(byte[]) 超时时返回 0
- QNX 端口
- read() 修复（现在与 Sun CommAPI 一致）
- 超时和阈值修复
- Debian 锁文件修复
- HP-UX 端口枚举修复

---

## 版本 1.5 系列

### 1.5-8 (2001年12月4日)

- True64 端口
- FreeBSD 修复
- UnixWare 和 OpenUNIX 修复
- `--disable-lockfiles` 修复
- Win32 端口枚举和速度修复
- 完整的 CommAPI 支持（Win32、Linux、Solaris）

### 1.5-7 (2001年11月2日)

- UnixWare 和 OpenUNIX 端口
- Mac OS X autotool 支持
- 异步写入修复
- 线程修复
- Win32 修复

### 1.5-6 (2001年10月14日)

- Mac OS X Code Warrior 端口
- RXTXcomm.jar 重命名（避免混淆）
- 端口枚举和多 Win32 修复

### 1.5-5 (2001年10月4日)

- 锁文件修复
- Win32 修复和增强
- 初始 Solaris 端口
- 初始 Mac OS X 端口
- 包重命名为 gnu.io
- 内存泄漏清理
- 交叉编译修复
- uucp_lock 文件支持

### 1.5-4 (2001年1月26日)

- Irix 构建修复
- Windows lcc 和 mingw 构建支持
- BeOS 打开和关闭串口
- HP-UX 构建修复
- 1.4 修复和特性合并

### 1.5-3 (2000年10月4日)

- 初始 BeOS 支持
- Win32 交叉构建修复
- Kaffe 支持
- FreeBSD 构建修复

### 1.5-2 (2000年7月16日)

- 合并 1.4-4 的更改
- 添加 RawIO 类和读写/打开/关闭函数

### 1.5-1 (2000年3月7日)

- RS485 写入支持
- Stallion 卡支持
- CommAPI 实现的端口枚举

---

## 版本 1.4 系列

### 1.4-15 到 1.4-6

- 各版本 FreeBSD 修复、HP-UX 支持、锁文件支持
- 添加 RXTXVersion.java
- 添加端口列表支持
- 延迟文档化
- 大量端口枚举和构建修复

### 1.4-5 (2000年8月18日)

- RXTXPort 构造函数设置端口名称
- removeEventListener() 修复/变通方案
- SGI Irix 构建修复
- 修正 SerialPortEvent.getNewValue()
- open()/close() 修复
- 1.5 停止位支持

### 1.4-3 到 1.4-1

- 同步修复
- 消除烦人的内核版本消息
- HP-UX 构建修复
- RXTXPort 的 read() 重写
- Suse 构建修复
- JDK-1.3 构建修复

---

## 早期版本 (1.3 系列及以前)

- Cyclades 和多端口卡支持
- Stallion 卡支持
- FreeBSD 支持
- Wayne Roberts 的 Win32 代码引入
- 阈值和超时实现
- 打印机端口支持
- 流控实现（硬件和软件）
- SunOS 支持
- 初始 IRIX 支持
- MINGW (Win32) 支持
- 完整 CommAPI 开始

---

## 版本 0.x 早期历史

| 版本 | 日期 | 说明 |
|-----|------|-----|
| 0.50 | 1997年3月17日 | 缓冲输入/输出，使用 FileDescriptors |
| 0.22 | 1997年3月14日 | 所有控制移至 Main.java，重命名类，添加调试 |
| 0.21 | 1997年3月12日 | 移除硬编码变量，添加 autoconf 能力，IRIX 支持 |
| 0.2 | 1997年3月11日 | 添加 autoconf 能力 |
| 0.1 | 1997年3月10日 | 初始版本 |

---

## 早期贡献者致谢

以下开发者在 RXTX 早期版本中做出了重要贡献：

- Kevin Hester (kevinh@acm.org) - CommAPI 启动，Linux Comm 项目
- Karl Asha (karl@blackdown.org) - 网站托管，autoconfig 调试
- Oliver Frommel (oliver@io.aec.at) - IRIX 端口，open() 调用修复
- Michael Forte (Michael.Forte@Corp.Sun.COM) - SunOS 端口
- Gilles Paquet (Gilles.Paquet@ulb.ac.be) - SunOS 端口
- Martin Pool (mbp@linuxcare.com) - 显式指定端口列表支持

---

*本变更日志翻译自 RXTX 官方 ChangeLog 文件。*
*原文地址：https://github.com/rxtx/rxtx/blob/development/ChangeLog*
