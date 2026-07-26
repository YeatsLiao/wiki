# RXTX 移植指南

> 本文档为 RXTX 官方 PORTING 文件的中文翻译版本。
> 适用于开发者将 RXTX 移植到新平台。

---

## 1. 移植注意事项

在尝试将 RXTX 移植到新平台时，请注意以下事项：

### 1.1 通用要求

- 确保目标平台有可用的 Java JDK（1.3 或更高版本）
- JNI 支持是必需的
- POSIX 兼容的串口 API（如 termios、termio）是核心依赖

> 📝 **什么是 POSIX？**  
> POSIX（Portable Operating System Interface）是 Unix 系统的标准接口规范定义了文件操作、进程管理、串口通信等标准函数。Linux、macOS、BSD 等都兼容 POSIX。termios 是 POSIX 定义的串口编程接口。

> 📝 **什么是 JNI？**  
> JNI（Java Native Interface）是 Java 调用本地（C/C++）代码的接口。通过 JNI，Java 程序可以调用操作系统的底层 API。

### 1.2 文件结构

RXTX 的原生代码遵循以下目录结构：

```
rxtx-native/
├── termios.c           # POSIX 串口通信实现
├── termios.h           # POSIX 头文件
├── ParallelImp.c       # 并口实现
├── SerialImp.c         # 串口实现（核心文件）
├── RXTXCommDriver.c    # CommAPI 驱动
├── EventThread.c       # 事件监听线程
└── ...
```

### 1.3 需要适配的部分

| 文件 | 需要适配的内容 |
|-----|---------------|
| `RXTXCommDriver.c` | 端口枚举逻辑、设备文件扫描 |
| `SerialImp.c` | termios 调用、锁文件处理 |
| `ParallelImp.c` | 并口硬件访问 |
| `Makefile.in` | 平台特定的构建配置 |

---

## 2. 已知支持的平台

| 平台 | 设备文件 | 备注 |
|-----|---------|------|
| **Linux** | `/dev/ttyS*` | 支持 specialx, cyclades, isdn4linux 驱动 |
| **FreeBSD** | `cuaa*` | |
| **NetBSD** | `tty0*` | |
| **OpenBSD** | `tty0*` | |
| **IRIX** | `ttyd*`, `ttym*`, `ttyf*` | SGI 工作站 |
| **HP-UX** | `tty0p*`, `tty1p*` | HP Unix |
| **Solaris** | `/dev/cua/a`, `/dev/cua/b` | 需手动创建设备节点 |
| **Mac OS X** | `/dev/cu.*`, `/dev/tty.*` | |
| **BeOS** | `/dev/ports/serial*` | |
| **Windows** | `COM1` - `COM256` | 使用 `//./COM?` 格式访问 |

> 📝 **设备文件命名差异**：  
> 不同 Unix 系统的串口设备文件命名不同，这是历史原因造成的：
> - Linux 使用 `ttyS*`（teletypewriter Serial）
> - FreeBSD 使用 `cua*`（Callout devices）
> - Solaris 使用 `cua/*`

---

## 3. 端口检测机制

RXTX 通过扫描设备目录来检测可用的串口。端口检测在 `RXTXCommDriver.c` 中实现。

### 3.1 扫描前缀列表

RXTX 使用以下前缀列表扫描设备目录：

```c
// Linux 的设备前缀列表（定义在 RXTXCommDriver.c 中）
const char *Linux_prefixes[] = {
    "ttyS",    // 标准串口
    "ttyUSB",  // USB 转串口
    "ttyACM",  // ACM 调制解调器
    "ttyESS",  // 调制解调器
    "ttyLT",   // 某些调制解调器
    "ttyMX",   // 多串口卡
    "ttym",    // 某些嵌入式平台
    "ttyMy",   // 某些平台
    "ttyC",    // 某些串口卡
    "ttyD",    // 某些平台
    NULL       // 列表结束
};
```

> 📝 **为什么需要前缀列表？**  
> `/dev` 目录下有大量设备文件，但只有符合这些前缀的才是串口。扫描所有文件会非常慢。

### 3.2 自定义端口列表

如果默认扫描不够用，可以设置系统属性强制指定端口：

```bash
# 格式：多个端口用冒号分隔
java -Dgnu.io.rxtx.SerialPorts=/dev/cua/a:/dev/cua/b MyApp
```

> 💡 **适用场景**：  
> - 非标准设备文件命名
> - 需要访问特定的虚拟串口
> - 调试时只想扫描特定端口

### 3.3 锁文件目录

| 操作系统 | 锁文件目录 |
|---------|----------|
| Linux | `/var/lock` |
| FreeBSD | `/var/spool/uucp/` |
| 大多数 Unix | `/usr/spool/locks`, `/usr/spool/uucp` |

> 📝 **什么是锁文件？**  
> 锁文件（如 `/var/lock/LCK..ttyS0`）用于防止多个程序同时打开同一个串口。当程序打开端口时创建锁文件，关闭时删除。

---

## 4. 设备命名规则

### 4.1 常见设备文件

#### Linux

```
/dev/ttyS0      # 第一个内置串口 (COM1)
/dev/ttyS1      # 第二个内置串口 (COM2)
/dev/ttyUSB0    # USB 转串口适配器 (最常见)
/dev/ttyACM0    # ACM 设备（调制解调器)
/dev/cua/*      # 呼叫设备（历史遗留）
```

> 💡 **Linux 串口编号规则**：  
> - ttyS0-ttyS3 通常是主板内置串口
> - ttyUSB0+ 是 USB 转串口，每次插拔可能编号不同
> - 查看方法：`ls -l /dev/ttyS* /dev/ttyUSB*`

#### Solaris

```
/dev/cua/a
/dev/cua/b
```

> ⚠️ Solaris 上可能需要手动创建设备节点，命令参考：
> ```bash
> mknod /dev/cua/a c 67 0
> ```

#### FreeBSD

```
/dev/cuaa0
/dev/cuaa1
/dev/cuaU0      # USB 串口
```

#### Mac OS X

```
/dev/cu.Bluetooth-PDA-Serial   # 蓝牙串口
/dev/cu.usbserial-*            # USB 串口
/dev/tty.*
```

> 💡 **macOS 查看可用串口**：
> ```bash
> ls /dev/cu.* /dev/tty.*
> ```

---

## 5. 串口引脚定义

### DB-9 引脚（最常用）

| 引脚 | 名称 | 方向 | 说明 |
|-----|------|-----|------|
| 1 | CD (Carrier Detect) | 输入 | 载波检测，modem 收到载波信号 |
| 2 | RXD (Receive Data) | 输入 | 接收数据 |
| 3 | TXD (Transmit Data) | 输出 | 发送数据 |
| 4 | DTR (Data Terminal Ready) | 输出 | 数据终端就绪 |
| 5 | GND (Ground) | — | 信号地 |
| 6 | DSR (Data Set Ready) | 输入 | 数据设备就绪 |
| 7 | RTS (Request To Send) | 输出 | 请求发送 |
| 8 | CTS (Clear To Send) | 输入 | 清除发送（同意接收） |
| 9 | RI (Ring Indicator) | 输入 | 振铃指示 |

> 📝 **DTR/DSR 和 RTS/CTS 的区别**：
> - DTR/DSR：数据终端和数据设备之间的握手信号
> - RTS/CTS：流控制信号，发送前请求许可

### DB-25 引脚（传统打印机并口也用这个）

| 引脚 | 名称 | 方向 |
|-----|------|-----|
| 2 | TXD | 输出 |
| 3 | RXD | 输入 |
| 7 | GND | — |
| 其他 | 参考 RS-232 标准 | — |

> 📝 **最小接线**：只需 3 根线即可通信：TX、RX、GND

---

## 6. 波特率配置

RXTX 支持标准和非标准波特率。标准波特率包括：

```
110, 300, 600, 1200, 2400, 4800, 9600,
19200, 38400, 57600, 115200, 230400, 460800, 921600
```

> 📝 **波特率与距离的关系**：
> - 9600 bps：最可靠，可达数百米（取决于线缆质量）
> - 115200 bps：短距离（< 10 米）使用带屏蔽的线缆

某些平台还支持自定义波特率（通过设置波特率除数实现）。

---

## 7. 编译标志

常见的编译标志：

| 标志 | 说明 |
|-----|-----|
| `HAVE_TERMIOS_H` | 平台有 termios.h 头文件 |
| `HAVE_FCNTL_H` | 平台有 fcntl.h 头文件 |
| `HAVE_SYS_FILE_H` | 平台有 sys/file.h 头文件 |
| `HAVE_PTHREAD_H` | 平台有 pthread.h（线程支持） |
| `REENTRANT` | 使用线程安全函数 |
| `DEBUG` | 启用调试输出 |

> 📝 **如何添加新平台支持**：
> 1. 在 configure.ac 中添加平台检测
> 2. 在 SerialImp.c 中添加 `#ifdef YOUR_PLATFORM` 分支
> 3. 在 Makefile.in 中添加构建规则

---

*本指南翻译自 RXTX 官方 PORTING 文档。*
*如有问题，请联系 rxtx 邮件列表或在 GitHub 上提交 Issue。*
