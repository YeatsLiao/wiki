# RXTX 常见问题

> 本文档为 RXTX 官方 Wiki 中 FAQ 页面的中文翻译版本。

---

## 1. 安装问题

### 1.1 如何安装 RXTX？

**答案：**
- **从源码构建**：使用 `./configure && make install` 命令
- **使用预编译二进制包**：Fizzed 提供了 Windows 和 Linux 的 32 位和 64 位预编译包
- **Maven 依赖**：可以通过 Maven 仓库或系统范围依赖引入

详细安装步骤请参考 [安装指南](../INSTALL.md)。

### 1.2 找不到 RXTXcomm.jar 文件？

**答案：**
- 从源码构建时，`make install` 会自动安装到 Java 扩展目录
- 使用预编译包时，确保将 RXTXcomm.jar 复制到 `<JAVA_HOME>/jre/lib/ext/` 目录
- 检查 CLASSPATH 是否包含该文件

### 1.3 本地库加载失败（UnsatisfiedLinkError）？

**答案：**
- 确保本地库文件（.dll 或 .so）放在正确的目录
- 32 位 Java 必须使用 32 位本地库，64 位 Java 必须使用 64 位本地库
- 检查 `java.library.path` 是否包含本地库所在目录

---

## 2. 运行时问题

### 2.1 找不到端口（No such port）？

**答案：**
- 检查设备是否正确连接
- 检查设备驱动是否安装
- 检查当前用户是否有端口访问权限
- 使用 `SerialPortUtil.getSerialPortList()` 查看可用端口

### 2.2 端口被占用（Port in use）？

**答案：**
- 关闭其他可能使用该端口的程序
- 检查 `/var/lock` 目录中的锁文件
- 重启系统释放端口

### 2.3 数据传输乱码？

**答案：**
- 确保两端的波特率、数据位、停止位、校验位设置一致
- 检查线缆连接是否正确（TX-RX 交叉）
- 检查电压匹配（RS-232 vs TTL）

### 2.4 无法读取数据？

**答案：**
- 检查流控设置是否正确
- 确保使用事件监听或适当的读取方式
- 检查设备是否正常发送数据

---

## 3. 硬件问题

### 3.1 串口线如何连接？

**答案：**
- **DB9 接口**：2 (RX), 3 (TX), 5 (GND)
- **DB25 接口**：2 (TX), 3 (RX), 7 (GND)
- 硬件流控需要连接更多引脚

### 3.2 ThinkPad 串口不工作？

**答案：**
- IBM ThinkPad 的外部串口默认是禁用的
- 使用 DOS 下的 `ps2.exe` 工具启用：`ps2 sera enable`

### 3.3 如何查看串口设备文件？

**答案：**
- Linux：`/dev/ttyS*` 或 `/dev/ttyUSB*`
- Windows：`COM1`, `COM2`, 等
- Mac OS：`/dev/cu.*` 或 `/dev/tty.*`

---

## 4. 开发问题

### 4.1 如何检测可用端口？

**答案：**
```java
Enumeration<CommPortIdentifier> portList = CommPortIdentifier.getPortIdentifiers();
while (portList.hasMoreElements()) {
    CommPortIdentifier port = portList.nextElement();
    System.out.println("端口：" + port.getName());
}
```

### 4.2 如何设置串口参数？

**答案：**
```java
serialPort.setSerialPortParams(
    9600,                      // 波特率
    SerialPort.DATABITS_8,      // 数据位
    SerialPort.STOPBITS_1,      // 停止位
    SerialPort.PARITY_NONE       // 校验位
);
```

### 4.3 如何使用事件监听？

**答案：**
- 实现 `SerialPortEventListener` 接口
- 注册监听器：`serialPort.addEventListener(listener)`
- 开启数据到达通知：`serialPort.notifyOnDataAvailable(true)`

### 4.4 如何自定义端口列表？

**答案：**
- 设置系统属性：`-Dgnu.io.rxtx.SerialPorts=/dev/cua/a:/dev/cua/b`
- 这样 RXTX 不会扫描目录，只使用指定的端口

---

## 5. 其他问题

### 5.1 RXTX 的许可证是什么？

**答案：**
- RXTX 使用 GNU LGPL v2.1 许可证
- 包含受控接口链接例外，允许通过 Sun Microsystem CommAPI 与 RXTX 通信的独立模块采用任何许可证

### 5.2 如何查看 RXTX 版本？

**答案：**
```java
System.out.println(RXTXVersion.getVersion());
```

### 5.3 RXTX 支持哪些平台？

**答案：**
- Linux
- Windows
- Mac OS
- Solaris
- FreeBSD
- HP-UX
- 等其他 POSIX 兼容系统

---

## 参考资源

- [RXTX 官方 Wiki](http://rxtx.qbang.org/wiki/)
- [安装指南](../INSTALL.md)
- [串口使用教程](../SerialPortInstructions.md)
- [移植指南](../Porting.md)

---

*本页面翻译自 RXTX 官方 Wiki。*
