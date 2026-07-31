# RXTX 安装指南

> 本指南为 RXTX 官方安装文档的中文翻译版本。
> 原文更新于：2008年11月27日
> 翻译整理：RXTX 中文社区

## 1. 其他语言的安装说明

### 日语

日文版安装说明由 Masayuki "Tencho" Yamashita 提供：

- 网址：http://www.geocities.co.jp/Technopolis/4789/settei.htm#id1
- 邮箱：tencho@venus.kanazawa-it.ac.jp

> 📌 **提示**：这些说明较为久远，但仍有参考价值。

## 2. 构建 CommAPI 支持

### 2.1 快速安装

RXTX 构建所需的基础包：

| 工具 | 推荐版本 | 说明 |
|-----|---------|------|
| autoconf | 2.59 | 自动生成 configure 脚本的工具 |
| automake | 1.9.5 | Makefile 自动生成工具 |
| libtool | 1.5.18 | 跨平台库管理工具 |
| GNU make | 3.79.1 | 构建工具 |
| JDK | 1.3 或更高 | Java 开发工具包 |

> 📝 **什么是 configure/make？**  
> 这是 Unix/Linux 软件编译安装的标准流程：
> - `./configure` 检测系统环境并生成 Makefile
> - `make` 编译源代码
> - `make install` 安装到系统目录

> ⚠️ **注意**：在某些系统（如 FreeBSD）上，`make` 命令名为 `gmake`。

**快速安装步骤：**

```bash
$ tar -xzvf rxtx-2.1.tar.gz
$ cd rxtx-2.1
$ ./configure   # 按照提示操作
$ make install  # 在使用 gmake 的系统上用 gmake
```

> ⚠️ **路径问题**：安装路径中**不能包含空格**！
> 
> ❌ 错误示例：`/home/jarvi/test build/rxtx/...`
> ✅ 正确示例：`/home/jarvi/test_build/rxtx/...`

如果快速安装方式不起效，或你不想让脚本修改系统，请继续阅读下面的详细说明。

### 2.1.1 预编译二进制包

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

**安装步骤：**

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

   **Maven 依赖**（如果使用系统范围依赖）：
   ```xml
   <dependency>
       <groupId>gnu.io</groupId>
       <artifactId>com-lib</artifactId>
       <version>2.2</version>
       <scope>system</scope>
       <systemPath>${project.basedir}/src/main/resources/jar/RXTXcomm.jar</systemPath>
   </dependency>
   ```

**注意事项：**
- 确保选择与你的 Java 版本（32位/64位）匹配的二进制包
- 测试通过的平台：
  - Windows：2008, 2003, Vista SP1
  - Linux：CentOS 5.0, 5.2

### 2.2 卸载 Sun 的 comm.jar

> 🔔 **重要提示**：Sun 的 comm.jar **不是必需的**。在某些平台上它是一个有效选项。
>
> ⚠️ **但在构建 rxtx 2.1 时，如果系统中已安装 Sun 的 comm.jar，会导致混乱！**

> 📝 **什么是 comm.jar？**  
> comm.jar 是 Sun 公司 Java Communications API 的实现包。RXTX 实现了相同的接口，可以替代它使用。

下载地址：http://java.sun.com/products/javacomm/index.html

### 2.3 安装 javax.comm.properties

> ℹ️ **更新**：在 rxtx-2.1 中，`javax.comm.properties` 文件**不再是必需的**。

> 📝 **什么是 javax.comm.properties？**  
> 这是 Sun CommAPI 的配置文件，用于指定可用端口。在旧版 RXTX 中需要手动创建，新版本已不再需要。

### 2.4 添加 RXTXcomm.jar 到 CLASSPATH

**JDK 1.1 版本：**

确保 `/usr/local/java/lib/RXTXcomm.jar` 在你的 CLASSPATH 中（如果需要使用依赖 RXTXcomm.jar 的应用程序）。

在 bash 中设置：
```bash
$ export CLASSPATH=/usr/local/java/lib/RXTXcomm.jar:.
```

> 📝 **什么是 CLASSPATH？**  
> CLASSPATH 是 Java 查找类文件（.class 和 .jar）的路径列表。类似于 Linux 的 PATH 环境变量，但用于 Java 类。

**JDK 1.2 及更高版本：**

无需额外配置（JDK 1.2+ 的扩展目录机制会自动加载 ext 目录下的 jar）。

### 2.5 构建和安装 JAR 包

| 步骤 | 命令 | 说明 |
|-----|------|-----|
| 配置 | `./configure` | 支持独立构建目录；需要 `javac` 在 PATH 中或设置 `JAVA_HOME` |
| 编译 | `make` | 构建 RXTXcomm.jar 和本地库 |
| 安装 | `make install` | 将 JAR 和库文件安装到正确位置 |

**指定 JDK 版本：**

```bash
$ export JAVA_HOME=/usr/local/java
```

否则 configure 会从 PATH 中查找 JDK。

> 📝 **什么是 JAVA_HOME？**  
> JAVA_HOME 是指向 JDK 安装目录的环境变量。构建工具通过它找到 javac、jni.h 等编译所需的文件。

### 2.6 安装文件位置

假设 Java 顶层目录为 `/usr/local/java`：

**JDK 1.2+：**

```
/usr/local/java/jre/lib/ext/RXTXcomm.jar        # 扩展库目录
/usr/local/java/jre/lib/$(ARCH)/librxtxSerial.so   # 串口本地库
/usr/local/java/jre/lib/$(ARCH)/librxtxParallel.so  # 并口本地库
/usr/local/java/jre/lib/$(ARCH)/lib/...          # 其他文件
```

**JDK 1.1.*：**

```
/usr/local/java/lib/RXTXcomm.jar
/usr/lib/librxtxSerial.so
/usr/lib/librxtxParallel.so
/usr/lib/...
```

> 💡 库文件放在 `/usr/lib` 是为了避免修改 `LD_LIBRARY_PATH`（系统动态库搜索路径）。

### 2.7 Windows 平台编译

RXTX 提供三种 Windows 编译方式：

#### 方式一：MinGW32 工具（在 Windows 命令行）

> 📝 **什么是 MinGW32？**  
> MinGW（Minimalist GNU for Windows）是 Windows 上的 GNU 工具集，可以在 Windows 上编译生成 Windows 可执行文件。

1. 安装 JDK：http://java.sun.com/j2se
2. 安装 MinGW32：http://www.mingw.org
3. 确保 `mingw32\bin` 和 `jdk\bin` 在 PATH 中
4. 在 rxtx 顶层目录执行：

```cmd
mkdir build-mingw
copy Makefile.mingw32 build-mingw\Makefile
cd build-mingw
:: 编辑 Makefile 确保路径正确
mingw32-make SHELL=cmd
mingw32-make SHELL=cmd install
```

#### 方式二：MS Visual Studio

1. 安装 JDK
2. 安装 Visual Studio（Express 版本即可）
3. 打开 Visual Studio 命令提示符
4. 在 rxtx 顶层目录执行：

```cmd
mkdir build-msvc
copy Makefile.msvc build-msvc\Makefile
cd build-msvc
:: 编辑 Makefile 确保路径正确
nmake
nmake install
```

#### 方式三：Linux 交叉编译

> 📝 **什么是交叉编译？**  
> 在一台机器上编译出另一台机器（不同架构或操作系统）可运行的程序。例如在 Linux 上编译出 Windows 可执行文件。

1. 安装 MinGW32 交叉编译工具
2. 获取 Sun JDK 1.2.2 的 Windows include 文件
3. 配置并编译：

```bash
$ export PATH="/usr/local/cross-tools/i386-mingw32/bin/:$PATH"
$ mkdir /home/jarvi/win32java
$ cp -r /mnt/win98//java/include /home/jarvi/win32java
$ export WIN32INCLUDE=/home/jarvi/tools/win32-include
$ cd rxtx-*
$ mkdir build && cd build
$ ../configure --target=i386-mingw32 --host=i386-redhat-linux
$ make
```

## 3. 常见问题解答

### A. 加载 `gnu.io.RXTXCommDriver` 时出现 `java.lang.UnsatisfiedLinkError: nSetOwner`

**问题描述：**
```
java.lang.UnsatisfiedLinkError: nSetOwner while loading driver gnu.io.RXTXCommDriver
```

**解决方案：** 不要使用 Sun 的 Windows CommAPI 文件，获取 Solaris 版本即可。如需 Sun 的解决方案，使用 `javacomm20-x86.tar.Z` 和 rxtx-1.4。

> 📝 **什么是 UnsatisfiedLinkError？**  
> 这是 Java 尝试加载本地库（.so 或 .dll）失败时抛出的异常。通常是因为库文件路径不对、版本不匹配，或缺少依赖的库。

### B. 启动时提示 `java.lang.UnsatisfiedLinkError: no rxtxSerial in java.library.path`

**问题描述：**
```
Exception in thread "main" java.lang.UnsatisfiedLinkError: no rxtxSerial in java.library.path
```

**原因：** `librxtxSerial.so` 放错了目录。

> 📝 **什么是 java.library.path？**  
> Java 加载本地库（.dll/.so）时搜索的路径列表。与 CLASSPATH 不同，CLASSPATH 只搜索 .class 和 .jar 文件。

**解决方案（三选一）：**

**方案 1**：移动文件到正确位置
```bash
$ mv /usr/local/lib/librxtxSerial.* /usr/local/java/jre/lib/i386/
```

**方案 2**：添加路径到 `LD_LIBRARY_PATH`
```bash
$ export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib/
```

**方案 3**：命令行指定路径
```bash
$ java -Djava.library.path=/usr/local/lib/ 你的程序
```

> 📝 **什么是 LD_LIBRARY_PATH？**  
> Linux 系统加载动态库（.so）时搜索的路径。可以理解为系统级别的"库路径"。

### C. 无法打开端口

**原因：** 当前用户可能没有访问设备的权限。

**解决方案：**

```bash
# 查看权限
$ ls -l /dev/ttyS?
# crw-rw---- 1 root uucp 4, 64 2009-08-10 12:00 /dev/ttyS0

# crw-rw---- 表示：字符设备文件，root 和 uucp 组可读写
# 解决方案：让当前用户加入 uucp 组，或临时修改权限
$ chmod 666 /dev/ttyS?
```

同时确保用户有创建锁文件的权限（见下文 R 部分）。

### D. 提示 `java.lang.NoClassDefFoundError: gnu/io/CommPort`

**原因：** `RXTXcomm.jar` 不在 classpath 中或位置不正确。

**检查步骤：**
```bash
# 查看 CLASSPATH
$ echo $CLASSPATH

# 运行时指定 classpath
$ java -cp /usr/local/java/jre/lib/ext/RXTXcomm.jar:. 你的程序
```

### E. 编译器找不到 Java 头文件

**检查步骤：**

1. 检查 Makefile 顶部的 include 路径是否正确：
```makefile
JAVAINCLUDE = -I /usr/local/java/include/
JAVANATINC = -I /usr/local/java/include/genunix
```

2. 检查 JAVA_HOME 环境变量是否设置正确。

> 📝 **什么是 jni.h？**  
> jni.h 是 Java Native Interface 的头文件，定义了 JNI 编程所需的类型和函数。编译 RXTX 的本地代码需要这个文件。

### F. Configure 报 "unterminated sed command" 错误

**原因：** `find` 命令产生了意外结果。

**解决方案：** 移除所有 `comm.jar`，让 configure 重新生成。

### G. 找不到 `libstdc++-libc6.0-1.so.2`

**适用系统：** JDK 1.2 + Red Hat

**解决方案：** 创建符号链接：
```bash
$ ln -s /usr/lib/libstdc++ /usr/lib/libstdc++-libc6.0-1.so.2
$ ls -l /usr/lib/libstdc++-libc6.0-1.so.2
# /usr/lib/libstdc++-libc6.0-1.so.2 -> libstdc++.so.2.8.0
```

### H. BlackBox 无法处理所有端口

**原因：** BlackBox.java 中有硬编码的端口数量限制。

**解决方案：** 在 BlackBox.java 中找到：
```java
portDisp = new SerialPortDisplay[50];
```
将 `50` 改为 `256`。

### I. 出现 "Illegal use of nonvirtual function call" 错误

**原因：** JDK 1.1 编译器生成的代码在 JDK 1.2 下无法通过验证。

**解决方案：**

1. 使用 JDK 1.2 的 javac 重新编译有问题的类
2. 或启动 JVM 时加上 `-noverify` 参数
3. 或使用全新构建目录重新编译和安装

### J. libc5 Linux 系统产生 SIGSEGV

**建议：** 升级到 glibc 系统 + libpthread-0.7 或更新版本。旧版 libc5 库问题较多，SIGSEGV 是最常见的症状。

> 📝 **什么是 SIGSEGV？**  
> SIGSEGV（Segmentation Violation）是 Unix 系统的信号，表示程序访问了不该访问的内存地址，通常会导致程序崩溃。

### K. 提示 "AM_PROG_LIBTOOL not found in library"

**解决方案：** 运行 autogen.sh 脚本重新生成脚本文件：

```bash
$ ./autogen.sh
```

### L. RMISecurityManager 相关问题

> ⚠️ **说明**：`RMISecurityManager.html` 原文件已从官方仓库移除，无法找到对应内容。
>
> 如果你需要使用 RXTX 配合 Java RMI SecurityManager，建议查阅：
> - RXTX 邮件列表历史记录（Majordomo@hex.linuxgrrls.org）
> - Oracle Java 官方文档中关于 SecurityManager 的通用说明
> - 在 GitHub Issue 中提出你的使用场景

### M. 串口线如何连接？

| 接口 | 引脚连接 | 说明 |
|-----|---------|------|
| **DB25** | 2 (TX), 3 (RX), 7 (GD) | 传统 25 针串口 |
| **DB9** | 2 (RX), 3 (TX), 5 (GD) | 9 针串口，最常用 |

> 💡 硬件流控需要连接更多引脚。

> 📝 **TX/RX/GD 是什么？**  
> - TXD（Transmit Data）：发送数据
> - RXD（Receive Data）：接收数据
> - GND（Ground）：信号地

### N. 应该使用哪个设备文件？

| 操作系统 | 设备文件 | 示例 |
|---------|---------|------|
| Linux | `/dev/ttyS?` | `/dev/ttyS0` |
| FreeBSD | `cuaa?` | `cuaa0` |
| NetBSD | `tty0?` | `tty00` |
| IRIX | `ttyd?`, `ttym?`, `ttyf?` | `ttyd1` |
| HP-UX | `tty0p?`, `tty1p?` | `tty0p0` |
| BeOS | `/dev/ports/serial?` | `/dev/ports/serial0` |
| Windows | `COM?` | `COM1` |

> 📝 **什么是 tty？**  
> tty 是 "teletypewriter"（电传打字机）的缩写。在 Unix/Linux 中，tty 代表终端设备。现在也用于指代串口设备。

> ℹ️ Linux 上据报道 specialx、cyclades 和 isdn4linux 也能工作，最多同时支持 64 个端口。

### O. 安装失败怎么办？

请按照以下脚本收集信息后反馈：

```bash
#!/bin/sh
which java
java -version
uname -a
autoconf --version
automake --version
libtool --version
make --version
```

维护者的参考环境：
- Java 1.4
- autoconf 2.53
- automake 1.6.3
- libtool 1.4.2
- GNU make 3.79.1

> ⚠️ **注意**：较旧版本的 make 已知会导致问题。

### P. 应该使用哪个 JDK？

理想情况下任何 JDK 都可以。以下是 RedHat 6.0 / kernel 2.2.17 / glibc 下的测试结果：

| glibc 版本 | Sun green threads | Sun native threads | IBM green | IBM native | Blackdown green | Blackdown native |
|-----------|-------------------|-------------------|-----------|------------|-----------------|------------------|
| glibc-2.1.1-6 | ✅ | \*1 | \*2 | \*2 | ✅ | \*3 |
| glibc-2.1.2-11 | ✅ | \*1 | ✅ | ✅ | ✅ | ✅ |
| glibc-2.1.2-17 | ✅ | \*1 | ✅ | ✅ | ✅ | ✅ |
| glibc-2.1.3-15 | ✅ | \*1 | ✅ | ✅ | ✅ | ✅ |

> 📝 **什么是 green threads / native threads？**  
> - **Green threads**：Java 虚拟机模拟的线程，不依赖系统线程
> - **Native threads**：直接使用操作系统原生线程，性能更好

> \*1 BlackBox 在多次 open()/close() 后会锁死  
> \*2 Java 无法启动，sem_wait 符号问题  
> \*3 Java 无法启动，sem_init 符号问题

**结论**：尽量避免 Sun 的 native threads，除非你能解决其问题。

### Q. RXTX 如何检测端口？可以覆盖吗？

RXTX 通过扫描 `/dev` 目录中匹配已知前缀（如 `ttyS`、`ttym` 等）的文件来检测端口。只有存在的、可读写的、当前操作系统支持的端口才会被 `CommPortIdentifier.getPortIdentifiers()` 返回。

**自定义端口：**

可以设置系统属性来指定端口列表：

```bash
$ java -Dgnu.io.rxtx.SerialPorts=/dev/cua/a:/dev/cua/b com.foo.MyApp
```

设置后 RXTX 不会扫描目录，只使用指定的端口。

> 📝 **波特率（Baud Rate）是什么？**  
> 波特率是串口通信的速度单位，表示每秒传输的信号变化次数。常见值：
> - 9600：慢速设备、GPS、调制解调器
> - 115200：高速设备、Arduino 默认值
> 发送和接收两端的波特率必须匹配。

> ℹ️ **Linux 端口枚举说明**：由于设备数量可能达到数千，全部检查没有意义。RXTX 在 `RXTXCommDriver.java` 中限制了 Linux 的端口扫描范围。需要额外端口时请参考文件中的说明。

### R. 如何使用锁文件？

**⚠️ 重要提示：**

- **Redhat 用户**：Redhat 7.2 起将组从 `uucp` 改为了 `lock`
- **Mandrake 用户**：`/var/lock` 需要属于 `uucp` 组才能正常工作
- **Mac OS X 用户**：自 2.1.8 起，RXTX 在 OSX 上不再使用锁文件

**锁文件的作用**：防止多个程序同时访问同一端口。

> 📝 **什么是锁文件？**  
> 锁文件是 Unix 系统中用于标记"设备正在使用中"的临时文件。例如 `/var/lock/LCK..ttyS0`。当程序打开串口时，RXTX 会在这个目录创建锁文件；关闭时删除。这样其他程序就知道端口已被占用。

**锁文件需要的权限配置：**

```bash
# 方法一：使用 root 或 uucp 用户身份运行 RXTX

# 方法二：将需要使用 RXTX 的用户添加到 uucp 组
# 编辑 /etc/group（作为 root）：
uucp::14:uucp
# 改为：
uucp::14:uucp,用户名
```

> ⚠️ 不要修改组号（14），只添加用户名。

**锁文件服务器（替代方案）：**

需要安装锁文件服务器：

```bash
$ configure --enable-lockfile_server
```

服务器以 `uucp` 或 `lock` 组身份运行，普通用户可以通过 localhost 连接来锁定和解锁端口。

### S. 如何查看 RXTX 版本？

自 rxtx-1.5-4 和 rxtx-1.4-6 起，RXTX 提供了 `RXTXVersion` 类：

```java
System.out.println(RXTXVersion.getVersion());
```

输出格式为 `RXTX-MAJOR.MINOR-PATCH`，例如 `RXTX-1.5-4`。

### T. RXTX 的延迟是多少？

在 PII 450MHz 上测试：

- **默认延迟**：150-200ms
- **优化后**（`SerialImp.c:eventLoop()` 中 `usleep(5000)`）：70-80ms

> 💡 理论上可以更低，但维护者缺乏测试设备。

> 📝 **什么是延迟（Latency）？**  
> 延迟是数据从发送到接收之间的时间。对于实时性要求高的应用（如工业控制），延迟越低越好。

### U. 在新操作系统上无法从端口读取数据

**症状：** 程序启动正常，可以写入数据，但 `select()` 调用挂起从不返回。

**可能原因：**

1. **两个 Java 程序同时打开了端口**（开发时容易发生）
   - 检查是否误用了 `<ctl> z` 而不是 `<ctl> c` 中断了程序

2. 这是 RXTX 添加锁文件支持的原因——如果另一个应用已打开端口，第二个应用会无法读取或只能读取部分数据。

**已知锁文件目录：**

```c
const char *lockdirs[] = {
    "/etc/locks", "/usr/spool/kermit", "/usr/spool/locks",
    "/usr/spool/uucp", "/var/lock", "/var/lock/modem",
    "/var/spool/lock", "/var/spool/locks", "/var/spool/uucp", NULL
};
```

Linux 使用 `/var/lock`，FreeBSD 使用 `/var/spool/uucp/`。

> 📝 **什么是 select()？**  
> select() 是 Unix 系统的系统调用，用于监视多个文件描述符（如串口），等待其中一个或多个变为"可读"或"可写"状态。RXTX 使用它实现事件驱动的数据读取。

### V. ThinkPad 串口不工作

> 💡 **重要发现**：IBM ThinkPad 的外部串口**默认是禁用的**！
>
> Windows 的 Thinkpad 配置实用程序和设备管理器显示已启用，但实际上是**假的**。

**启用方法：**

1. 找到 DOS 下的 `ps2.exe` BIOS 配置工具（在 Windows 2000 下位于 `c:\Program Files\Thinkpad\utilities`）
2. 运行：
   ```cmd
   ps2 sera enable
   ```
3. 完成后，`setserial -ga /dev/ttyS0` 才能正确识别 UART

> 📝 **什么是 UART？**  
> UART（Universal Asynchronous Receiver/Transmitter）是串口通信的硬件芯片，负责并行数据与串行信号的转换。

## 4. 小程序（Applets）

### 使用签名的小程序

Java 小程序在安全管理器的沙箱中运行。Applet 必须签名才能访问串口。

> 📝 **什么是 Applet？**  
> Applet 是嵌入网页的 Java 程序，运行在浏览器的沙箱中，权限受限。访问本地资源（如串口）需要签名授权。

**开发阶段替代方案：**

在 Mozilla 的 `prefs.js` 文件中添加（位于 `~/.mozilla/default/XYYrandomDirName`）：

```javascript
user_pref("signed.applets.codebase_principal_support", true);
```

## 附录：环境变量提示

**Redhat 7.1 用户：**

```bash
export LD_ASSUME_KERNEL=2.2.5
```

> 📝 **什么是 LD_ASSUME_KERNEL？**  
> 这是一个 glibc 环境变量，用于指定程序期望的 glibc 版本。某些旧程序在新的 glibc 版本上可能不兼容，设置这个变量可以"欺骗"程序使用兼容模式。

*本指南翻译自 RXTX 官方 INSTALL 文档。*
*原文地址：https://github.com/rxtx/rxtx*
*翻译版本：基于 2008 年 11 月 27 日版本*
