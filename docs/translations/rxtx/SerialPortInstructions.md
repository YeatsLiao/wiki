# RXTX 串口使用示例

> 本文档为 RXTX 官方 SerialPortInstructions.txt 的中文翻译版本。
> 适用于 Linux 初学者学习使用 Java 读写串口的入门指南。

---

## 1. 简介

RXTX 为 Java 程序提供了访问计算机串口的能力。本文档将帮助你：

- 找到正确的串口设备文件
- 理解串口权限
- 编写简单的串口通信程序

> 💡 **什么是串口？**  
> 串口（Serial Port）是一种逐位发送数据的通信接口，常用于：
> - 单片机开发（Arduino、STM32 等）
> - 工业设备通信（PLC、仪器仪表）
> - GPS 模组、调制解调器
> - 老式打印机、扫描枪

---

## 2. 查找串口

### Linux 上的串口设备文件

```
/dev/ttyS0   - 第一个串口 (通常对应 Windows 的 COM1)
/dev/ttyS1   - 第二个串口 (COM2)
/dev/ttyS2   - 第三个串口 (COM3)
...
```

> 📝 **什么是 /dev/ttyS*？**  
> 在 Linux 中，设备以文件形式存在于 `/dev` 目录下。`ttyS` 代表 UART 串口设备。

### USB 串口适配器

如果你使用的是 USB 转串口适配器，设备文件名通常是：

```
/dev/ttyUSB0   # 最常见的 USB 转串口芯片
/dev/ttyUSB1
/dev/ttyACM0   # ACM 设备，通常是手机的调制解调器接口
```

> 📝 **为什么 USB 串口是 ttyUSB 而不是 ttyS？**  
> USB 转串口芯片（如 CH340、PL2303、FTDI）在内核中映射为不同的驱动，产生的设备名以 `ttyUSB` 开头。

### 查看可用端口

```bash
# 方法一：列出所有 tty 设备
$ ls -la /dev/tty*

# 方法二：只列出串口
$ ls -la /dev/ttyS*

# 方法三：查看设备列表（需要 root）
$ dmesg | grep tty
```

> 📝 **dmesg 是什么？**  
> dmesg 显示内核启动信息，插入 USB 设备后会看到新设备的检测信息。

### Windows 上的端口

```
COM1, COM2, COM3, ...
```

在 Java 中使用：
```java
String portName = "COM1";          // Windows
String portName = "/dev/ttyS0";    // Linux
String portName = "/dev/ttyUSB0";  // Linux (USB 适配器)
```

---

## 3. 查看端口权限

### 查看当前权限

```bash
$ ls -l /dev/ttyS0
crw-rw---- 1 root uucp 4, 64 2009-08-10 12:00 /dev/ttyS0
```

权限说明：
- `crw-rw----` - 字符设备文件（c），拥有者和组可读写（rw-rw----）
- `root uucp` - 属于 root 用户和 uucp 组
- `4, 64` - 主设备号 4，次设备号 64（设备编号）

> 📝 **什么是字符设备？**  
> Linux 中设备分为字符设备（逐字符 I/O，如串口）和块设备（按块读写，如硬盘）。串口是字符设备。

### 修改权限

**临时修改（重启后失效）：**
```bash
# 允许所有用户读写（开发环境可用）
$ sudo chmod 666 /dev/ttyS0
```

**永久修改（推荐）：**

将用户添加到 dialout 或 uucp 组：

```bash
# Ubuntu/Debian - 串口通常属于 dialout 组
$ sudo usermod -a -G dialout 用户名

# Fedora/RHEL - 串口通常属于 uucp 组
$ sudo usermod -a -G uucp 用户名
```

> ⚠️ 修改后需要**重新登录**（或重启会话）才能使组权限生效！

> 📝 **为什么要用组权限而不是 chmod 777？**  
> `chmod 666` 让所有人可读写，但不够安全。正确的做法是让用户加入设备所属的组（dialout/uucp），这样只有授权用户才能访问串口。

---

## 4. 简单的读写程序

### 4.1 添加 RXTX 到项目

**Maven 依赖：**
```xml
<dependency>
    <groupId>org.rxtx</groupId>
    <artifactId>rxtx</artifactId>
    <version>2.2</version>
</dependency>
```

**或者手动安装：**
1. 下载 RXTX 二进制包
2. 将 `RXTXcomm.jar` 添加到 classpath
3. 将对应平台的本地库放到 Java 库路径：
   - Linux: `librxtxSerial.so`
   - Windows: `rxtxSerial.dll`

> 📝 **native library（本地库）是什么？**  
> RXTX 由两部分组成：
> - Java 部分（`RXTXcomm.jar`）：提供 API 接口
> - 本地库（`.so`/`.dll`）：直接与操作系统交互
>
> 两者缺一不可！

### 4.2 完整的串口通信示例

```java
import gnu.io.*;  // RXTX 使用的包名，与 Sun 的 javax.comm 兼容

import java.io.*;
import java.util.*;

public class SerialTest {

    private static final String PORT_NAMES = "/dev/ttyS0";

    public static void main(String[] args) {
        CommPortIdentifier portId = null;
        Enumeration<?> portEnum = CommPortIdentifier.getPortIdentifiers();

        // 步骤 1：查找端口
        while (portEnum.hasMoreElements()) {
            CommPortIdentifier currPortId =
                (CommPortIdentifier) portEnum.nextElement();
            if (currPortId.getName().equals(PORT_NAMES)) {
                portId = currPortId;
                break;
            }
        }

        if (portId == null) {
            System.out.println("找不到端口: " + PORT_NAMES);
            System.out.println("提示：检查端口名称是否正确，是否有权限访问");
            return;
        }

        try {
            // 步骤 2：打开端口（超时设置为 2 秒）
            // open() 是阻塞的，如果端口被占用，会等待超时时间
            SerialPort serialPort = (SerialPort) portId.open("SerialTest", 2000);

            // 步骤 3：配置串口参数
            serialPort.setSerialPortParams(
                9600,                      // 波特率：每秒 9600 位
                SerialPort.DATABITS_8,      // 数据位：8 位
                SerialPort.STOPBITS_1,      // 停止位：1 位
                SerialPort.PARITY_NONE       // 校验位：无
            );

            // 步骤 4：设置流控（默认通常是无，这里示例如何设置）
            // serialPort.setFlowControlMode(
            //     SerialPort.FLOWCONTROL_NONE);

            // 步骤 5：获取输入/输出流
            InputStream in = serialPort.getInputStream();
            OutputStream out = serialPort.getOutputStream();

            // 步骤 6：发送数据
            out.write("Hello Serial Port!".getBytes());
            out.flush();  // 立即发送，不要等缓冲区满

            // 步骤 7：读取数据（简单轮询方式）
            byte[] buffer = new byte[1024];
            int len = -1;
            while ((len = in.read(buffer)) != -1) {
                System.out.print(new String(buffer, 0, len));
            }

            // 步骤 8：关闭端口（重要！记得释放资源）
            in.close();
            out.close();
            serialPort.close();

        } catch (PortInUseException e) {
            System.out.println("端口被占用！请关闭其他使用该端口的程序");
        } catch (UnsupportedCommOperationException e) {
            System.out.println("串口参数不支持！检查波特率等设置是否正确");
        } catch (IOException e) {
            System.out.println("I/O 错误: " + e.getMessage());
        }
    }
}
```

> 📝 **串口参数详解**：
> - **波特率（Baud Rate）**：通信速度，如 9600 表示每秒传输 9600 位
> - **数据位（Data Bits）**：每个字符的位数，通常是 8
> - **停止位（Stop Bits）**：表示字符结束，通常是 1
> - **校验位（Parity）**：错误检测，None 表示不校验
>
> 两端必须完全一致才能正常通信！

### 4.3 带事件监听的示例

上面的例子使用轮询方式（不断检查是否有数据）。更高效的方式是使用**事件监听**：

```java
import gnu.io.*;

public class SerialEventListener implements SerialPortEventListener {

    private SerialPort serialPort;
    private InputStream in;

    public void initialize(SerialPort serialPort) {
        this.serialPort = serialPort;
        try {
            in = serialPort.getInputStream();
            serialPort.addEventListener(this);  // 注册监听器
            serialPort.notifyOnDataAvailable(true);  // 开启数据到达通知
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void serialEvent(SerialPortEvent event) {
        switch (event.getEventType()) {
            case SerialPortEvent.DATA_AVAILABLE:
                // 有数据可读
                try {
                    while (in.available() > 0) {
                        int data = in.read();
                        System.out.print((char) data);
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
                break;

            case SerialPortEvent.OE:
                // Overrun Error - 数据覆盖
                System.out.println("溢出错误");
                break;

            case SerialPortEvent.PE:
                // Parity Error - 校验错误
                System.out.println("校验错误");
                break;

            case SerialPortEvent.FE:
                // Framing Error - 帧错误
                System.out.println("帧错误");
                break;

            case SerialPortEvent.BI:
                // Break Interrupt - 中断信号
                System.out.println("收到中断信号");
                break;
        }
    }
}
```

> 📝 **为什么用事件监听而不是轮询？**  
> 轮询会浪费 CPU 资源（一直检查）。事件监听只在有数据时才通知，更高效、更省电。

---

## 5. 常用波特率

| 波特率 | 适用场景 | 说明 |
|-------|---------|------|
| 1200 | 老式调制解调器 | 很慢但可靠 |
| 9600 | GPS、单片机、老设备 | 最常用 |
| 19200 | 工业设备 | 中速 |
| 38400 | 高速工业设备 | — |
| 57600 | 较少使用 | — |
| 115200 | 高速通信、微控制器 | Arduino 默认 |
| 921600 | 超高速通信 | 需要好线缆 |

> 💡 **选择波特率的建议**：
> - 短距离（<1米）：可用任意波特率
> - 长距离或环境干扰大：用较低的波特率更稳定
> - Arduino 通信：通常用 9600 或 115200

---

## 6. 故障排除

### 问题：提示 "No serial ports found!"

**检查步骤：**
1. 设备是否正确连接？（USB 适配器要插紧）
2. 设备驱动是否安装？（`dmesg | tail` 查看）
3. 当前用户是否有端口访问权限？（`ls -l /dev/ttyUSB0`）

### 问题：可以发送但无法接收数据

**可能原因：**
1. 另一程序正在使用该端口（检查锁文件 `/var/lock/`）
2. 波特率或数据格式不匹配
3. 硬件连接问题（接线错误、松动）
4. 线缆质量问题（长距离需要带屏蔽的线）

### 问题：数据全是乱码

**检查项：**
1. 波特率是否匹配？（最常见原因！）
2. 数据位、停止位、校验位是否正确？
3. 两端电压是否匹配？（RS-232 vs TTL）
4. 是否需要交叉连接？（TX 接 RX）

> 📝 **TX/RX 交叉连接**：  
> 串口连接时，一方的 TX（发送）要接另一方的 RX（接收）：
> - A 设备 TX → B 设备 RX
> - A 设备 RX → B 设备 TX
> - GND → GND

---

## 7. 相关资源

- RXTX 官方文档：https://github.com/rxtx/rxtx
- 安装指南：[INSTALL.md](INSTALL.md)
- 移植指南：[Porting.md](Porting.md)
- 贡献者列表：[AUTHORS.md](AUTHORS.md)
- 常见问题：[FAQ](wiki/FAQ.md)
- 开发指南：[Development](wiki/Development.md)
- 下载资源：[Download](wiki/Download.md)

---

## 8. 高级封装示例

以下是一个更完整的串口操作封装示例，包含参数配置、工具类和测试代码：

### 8.1 串口参数封装

```java
package com.pilot.ioserver.basic.pbl.port.serialPort;

import gnu.io.SerialPort;

/**
 * 串口参数
 */
public final class SerialPortParameter {

    /**
 * 串口名称(COM0、COM1、COM2等等)
 */
    private String serialPortName;
    /**
 * 波特率
 * 默认：115200
 */
    private int baudRate;
    /**
 * 数据位 默认8位
 * 可以设置的值：SerialPort.DATABITS_5、SerialPort.DATABITS_6、SerialPort.DATABITS_7、SerialPort.DATABITS_8
 * 默认：SerialPort.DATABITS_8
 */
    private int dataBits;
    /**
 * 停止位
 * 可以设置的值：SerialPort.STOPBITS_1、SerialPort.STOPBITS_2、SerialPort.STOPBITS_1_5
 * 默认：SerialPort.STOPBITS_1
 */
    private int stopBits;
    /**
 * 校验位
 * 可以设置的值：SerialPort.PARITY_NONE、SerialPort.PARITY_ODD、SerialPort.PARITY_EVEN、SerialPort.PARITY_MARK、SerialPort.PARITY_SPACE
 * 默认：SerialPort.PARITY_NONE
 */
    private int parity;

    public SerialPortParameter(String serialPortName) {
        this.serialPortName = serialPortName;
        this.baudRate = 115200;
        this.dataBits = SerialPort.DATABITS_8;
        this.stopBits = SerialPort.STOPBITS_1;
        this.parity = SerialPort.PARITY_NONE;
    }

    public SerialPortParameter(String serialPortName, int baudRate) {
        this.serialPortName = serialPortName;
        this.baudRate = baudRate;
        this.dataBits = SerialPort.DATABITS_8;
        this.stopBits = SerialPort.STOPBITS_1;
        this.parity = SerialPort.PARITY_NONE;
    }

    public String getSerialPortName() {
        return serialPortName;
    }

    public void setSerialPortName(String serialPortName) {
        this.serialPortName = serialPortName;
    }

    public int getBaudRate() {
        return baudRate;
    }

    public void setBaudRate(int baudRate) {
        this.baudRate = baudRate;
    }

    public int getDataBits() {
        return dataBits;
    }

    public void setDataBits(int dataBits) {
        this.dataBits = dataBits;
    }

    public int getStopBits() {
        return stopBits;
    }

    public void setStopBits(int stopBits) {
        this.stopBits = stopBits;
    }

    public int getParity() {
        return parity;
    }

    public void setParity(int parity) {
        this.parity = parity;
    }
}
```

### 8.2 串口工具类

```java
package com.pilot.ioserver.basic.pbl.port.serialPort;

import gnu.io.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.TooManyListenersException;

/**
 * 串口工具类
 */
public class SerialPortUtil {

    /**
 * 获得系统可用的端口名称列表(COM0、COM1、COM2等等)
 *
 * @return List<String>可用端口名称列表
 */

    @SuppressWarnings("unchecked")
    public static List<String> getSerialPortList() {
        List<String> systemPorts = new ArrayList<>();
        //获得系统可用的端口
        Enumeration<CommPortIdentifier> portList = CommPortIdentifier.getPortIdentifiers();
        while (portList.hasMoreElements()) {
            String portName = portList.nextElement().getName();//获得端口的名字
 systemPorts.add(portName);
        }
        return systemPorts;
    }

    /**
 * 打开串口
 *
 * @param serialPortName 串口名称
 * @return SerialPort 串口对象
 * @throws NoSuchPortException 对应串口不存在
 * @throws PortInUseException 串口在使用中
 * @throws UnsupportedCommOperationException 不支持操作操作
 */
    public static SerialPort openSerialPort(String serialPortName)
            throws NoSuchPortException, PortInUseException, UnsupportedCommOperationException {
        SerialPortParameter parameter = new SerialPortParameter(serialPortName);
        return openSerialPort(parameter);
    }

    /**
 * 打开串口
 *
 * @param serialPortName 串口名称
 * @param baudRate 波特率
 * @return SerialPort 串口对象
 * @throws NoSuchPortException 对应串口不存在
 * @throws PortInUseException 串口在使用中
 * @throws UnsupportedCommOperationException 不支持操作操作
 */
    public static SerialPort openSerialPort(String serialPortName, int baudRate)
            throws NoSuchPortException, PortInUseException, UnsupportedCommOperationException {
        SerialPortParameter parameter = new SerialPortParameter(serialPortName, baudRate);
        return openSerialPort(parameter);
    }

    /**
 * 打开串口
 *
 * @param serialPortName 串口名称
 * @param baudRate 波特率
 * @param timeout 串口打开超时时间
 * @return SerialPort 串口对象
 * @throws NoSuchPortException 对应串口不存在
 * @throws PortInUseException 串口在使用中
 * @throws UnsupportedCommOperationException 不支持操作操作
 */
    public static SerialPort openSerialPort(String serialPortName, int baudRate, int timeout)
            throws NoSuchPortException, PortInUseException, UnsupportedCommOperationException {
        SerialPortParameter parameter = new SerialPortParameter(serialPortName, baudRate);
        return openSerialPort(parameter, timeout);
    }

    /**
 * 打开串口
 *
 * @param parameter 串口参数
 * @return SerialPort 串口对象
 * @throws NoSuchPortException 对应串口不存在
 * @throws PortInUseException 串口在使用中
 * @throws UnsupportedCommOperationException 不支持操作操作
 */
    public static SerialPort openSerialPort(SerialPortParameter parameter)
            throws NoSuchPortException, PortInUseException, UnsupportedCommOperationException {
        return openSerialPort(parameter, 2000);
    }

    /**
 * 打开串口
 *
 * @param parameter 串口参数
 * @param timeout 串口打开超时时间
 * @return SerialPort串口对象
 * @throws NoSuchPortException 对应串口不存在
 * @throws PortInUseException 串口在使用中
 * @throws UnsupportedCommOperationException 不支持操作操作
 */
    public static SerialPort openSerialPort(SerialPortParameter parameter, int timeout)
            throws NoSuchPortException, PortInUseException, UnsupportedCommOperationException {
        //通过端口名称得到端口
        CommPortIdentifier portIdentifier = CommPortIdentifier.getPortIdentifier(parameter.getSerialPortName());
        //打开端口，（自定义名字，打开超时时间）
        CommPort commPort = portIdentifier.open(parameter.getSerialPortName(), timeout);
        //判断是不是串口
        if (commPort instanceof SerialPort) {
            SerialPort serialPort = (SerialPort) commPort;
            //设置串口参数（波特率，数据位8，停止位1，校验位无）
 serialPort.setSerialPortParams(parameter.getBaudRate(), parameter.getDataBits(), parameter.getStopBits(), parameter.getParity());
            System.out.println("开启串口成功，串口名称：" + parameter.getSerialPortName());
            return serialPort;
        } else {
            //是其他类型的端口
            throw new NoSuchPortException();
        }
    }

    /**
 * 关闭串口
 *
 * @param serialPort 要关闭的串口对象
 */
    public static void closeSerialPort(SerialPort serialPort) {
        if (serialPort != null) {
 serialPort.close();
            System.out.println("关闭了串口：" + serialPort.getName());
        }
    }

    /**
 * 向串口发送数据
 *
 * @param serialPort 串口对象
 * @param data 发送的数据
 */
    public static void sendData(SerialPort serialPort, byte[] data) {
        OutputStream os = null;
        try {
            //获得串口的输出流
 os = serialPort.getOutputStream();
 os.write(data);
 os.flush();
        } catch (IOException e) {
 e.printStackTrace();
        } finally {
            try {
                if (os != null) {
 os.close();
                }
            } catch (IOException e) {
 e.printStackTrace();
            }
        }
    }

    /**
 * 从串口读取数据
 *
 * @param serialPort 要读取的串口
 * @return 读取的数据
 */
    public static byte[] readData(SerialPort serialPort) {
        InputStream is = null;
        byte[] bytes = null;
        try {
            //获得串口的输入流
 is = serialPort.getInputStream();
            //获得数据长度
            int bufflenth = is.available();
            while (bufflenth != 0) {
                //初始化byte数组
 bytes = new byte[bufflenth];
 is.read(bytes);
 bufflenth = is.available();
            }
        } catch (IOException e) {
 e.printStackTrace();
        } finally {
            try {
                if (is != null) {
 is.close();
                }
            } catch (IOException e) {
 e.printStackTrace();
            }
        }
        return bytes;
    }

    /**
 * 给串口设置监听
 *
 * @param serialPort serialPort 要读取的串口
 * @param listener SerialPortEventListener监听对象
 * @throws TooManyListenersException 监听对象太多
 */
    public static void setListenerToSerialPort(SerialPort serialPort, SerialPortEventListener listener) throws TooManyListenersException {
        //给串口添加事件监听
 serialPort.addEventListener(listener);
        //串口有数据监听
 serialPort.notifyOnDataAvailable(true);
        //中断事件监听
 serialPort.notifyOnBreakInterrupt(true);
    }

}
```

### 8.3 测试代码

```java
package com.pilot.ioserver.basic.pbl.port.serialPort;

import gnu.io.*;
import org.junit.Test;

import java.util.List;
import java.util.TooManyListenersException;

/**
 * 串口测试代码
 */
public class SerialPortUtilTest {

    /**
 * 测试获取串口列表
 */
    @Test
    public void getSystemPortList() {

        List<String> portList = SerialPortUtil.getSerialPortList();
        System.out.println(portList);

    }

    /**
 * 测试串口打开，读，写操作
 */
    @Test
    public void serialPortAction() {
        try {
            final SerialPort serialPort = SerialPortUtil.openSerialPort("COM2", 115200);
            //启动一个线程每2s向串口发送数据，发送1000次hello
            new Thread(() -> {
                int i = 1;
                while (i < 1000) {
                    String s = "hello";
                    byte[] bytes = s.getBytes();
                    SerialPortUtil.sendData(serialPort, bytes);//发送数据
 i++;
                    try {
                        Thread.sleep(2000);
                    } catch (InterruptedException e) {
 e.printStackTrace();
                    }
                }
            }).start();
            //设置串口的listener
            SerialPortUtil.setListenerToSerialPort(serialPort, event -> {
                //数据通知
                if (event.getEventType() == SerialPortEvent.DATA_AVAILABLE) {
                    byte[] bytes = SerialPortUtil.readData(serialPort);
                    System.out.println("收到的数据长度：" + bytes.length);
                    System.out.println("收到的数据：" + new String(bytes));
                }
            });
            try {
                // sleep 一段时间保证线程可以执行完
                Thread.sleep(3 * 30 * 1000);
            } catch (InterruptedException e) {
 e.printStackTrace();
            }
        } catch (NoSuchPortException | PortInUseException | UnsupportedCommOperationException | TooManyListenersException e) {
 e.printStackTrace();
        }
    }

}
```

---

*本指南翻译自 RXTX 官方 SerialPortInstructions.txt。*
*原文作者：Vaibhav Andleigh / Athena <andleigh@mit.edu>*
