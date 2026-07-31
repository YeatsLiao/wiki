# RXTX 开发指南

> 本文档为 RXTX 官方 Wiki 中开发相关页面的中文翻译版本。

## 1. 开发环境搭建

### 1.1 必要工具

- **JDK**：1.3 或更高版本
- **C 编译器**：如 gcc (Linux) 或 Visual Studio (Windows)
- **构建工具**：
  - autoconf 2.59+
  - automake 1.9.5+
  - libtool 1.5.18+
  - GNU make 3.79.1+

### 1.2 从源码构建

```bash
# 克隆仓库
git clone https://github.com/rxtx/rxtx.git
cd rxtx

# 生成配置脚本（如果需要）
./autogen.sh

# 配置
./configure

# 编译
make

# 安装
make install
```

### 1.3 交叉编译

**Linux 交叉编译 Windows 版本：**

```bash
# 安装 MinGW32 交叉编译工具
export PATH="/usr/local/cross-tools/i386-mingw32/bin/:$PATH"

# 设置 Windows Java 头文件路径
export WIN32INCLUDE=/path/to/win32-include

# 配置并编译
mkdir build && cd build
../configure --target=i386-mingw32 --host=i386-redhat-linux
make
```

## 2. 代码结构

### 2.1 主要目录

```
rxtx/
├── src/             # 源代码
│   ├── gnu/io/      # Java 代码
│   └── native/      # 本地代码（C/C++）
├── Makefile.in      # 构建配置模板
├── configure.ac     # 自动配置脚本
└── README           # 项目说明
```

### 2.2 核心文件

**Java 代码：**
- `gnu/io/CommPortIdentifier.java` - 端口标识符管理
- `gnu/io/SerialPort.java` - 串口操作类
- `gnu/io/ParallelPort.java` - 并口操作类
- `gnu/io/RXTXCommDriver.java` - 驱动实现

**本地代码：**
- `native/SerialImp.c` - 串口实现
- `native/ParallelImp.c` - 并口实现
- `native/RXTXCommDriver.c` - 驱动实现
- `native/termios.c` - POSIX 串口通信

## 3. 贡献流程

### 3.1 提交代码

1. **Fork 仓库**：在 GitHub 上 fork RXTX 仓库
2. **克隆仓库**：`git clone https://github.com/your-username/rxtx.git`
3. **创建分支**：`git checkout -b feature-branch`
4. **修改代码**：实现功能或修复 bug
5. **提交更改**：`git commit -m "描述你的更改"`
6. **推送分支**：`git push origin feature-branch`
7. **创建 Pull Request**：在 GitHub 上提交 PR

### 3.2 代码规范

- 遵循 Java 代码规范
- C 代码遵循 POSIX 风格
- 提交消息清晰描述更改内容
- 为新功能添加文档

### 3.3 报告 Bug

- 在 GitHub Issues 中报告 bug
- 提供详细的错误信息和复现步骤
- 包括操作系统、Java 版本、RXTX 版本等信息

## 4. 开发指南

### 4.1 如何添加新平台支持

1. **了解平台特性**：研究目标平台的串口 API
2. **修改配置脚本**：在 `configure.ac` 中添加平台检测
3. **添加平台特定代码**：在 `SerialImp.c` 中添加条件编译代码
4. **测试**：确保在目标平台上正常工作

### 4.2 如何实现新功能

1. **分析需求**：明确功能需求和实现范围
2. **设计接口**：遵循 CommAPI 规范设计接口
3. **实现代码**：同时实现 Java 层和本地层代码
4. **测试**：编写测试用例验证功能
5. **文档**：更新相关文档

### 4.3 常见开发问题

- **JNI 调用问题**：确保 Java 方法和本地方法签名匹配
- **平台差异**：注意不同平台的 API 差异
- **权限问题**：确保测试环境有正确的设备访问权限
- **锁文件问题**：理解不同平台的锁文件机制

## 5. 调试技巧

### 5.1 启用调试输出

**在构建时启用调试：**

```bash
./configure --enable-debug
make
```

**运行时启用调试：**

```bash
java -Dgnu.io.rxtx.debug=true YourApplication
```

### 5.2 常见调试场景

**端口检测问题：**
- 检查 `RXTXCommDriver.java` 中的端口扫描逻辑
- 验证设备文件权限

**数据传输问题：**
- 使用 `strace` (Linux) 或 `Process Explorer` (Windows) 监控系统调用
- 检查串口参数设置是否正确
- 验证线缆连接

**本地库加载问题：**
- 检查 `java.library.path` 设置
- 验证本地库与 Java 版本匹配（32位/64位）
- 检查依赖库是否存在

## 6. 资源

- [RXTX 官方 GitHub 仓库](https://github.com/rxtx/rxtx)
- [Java Communications API 文档](https://docs.oracle.com/cd/E17802_01/products/products/javacomm/reference/api/)
- [JNI 编程指南](https://docs.oracle.com/javase/8/docs/technotes/guides/jni/)
- [POSIX 串口编程](http://www.cmrr.umn.edu/~strupp/serial.html)

*本页面翻译自 RXTX 官方 Wiki。*
