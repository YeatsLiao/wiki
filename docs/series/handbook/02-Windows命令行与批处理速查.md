# Windows 命令行与批处理速查

> 适用：cmd / .bat 批处理。PowerShell 语法另说（cmd 命令大多可在 PowerShell 中使用，反之不行）。

## 一、命令行基础

**通用规则**：不区分大小写；↑↓ 翻历史命令；Tab 补全；`命令 /?` 查用法（`[]` 为可选项）。

### 基本命令

| 命令 | 功能 | 举例 |
| :--- | :--- | :--- |
| `echo` | 显示文字 | `echo hello` |
| `pause` | 暂停 | `pause > nul`（不显示提示） |
| `cls` | 清屏 | |
| `exit` | 退出 | |
| `type` | 显示文件内容 | `type 1.txt` |
| `find` | 查找字符串 | `find "abc" 2.txt` |
| `fc` | 比较文件内容 | `fc 1.txt 2.txt` |
| `date` / `time` | 显示/修改日期时间 | `date /T`（只显示不修改） |
| `ping` | 网络连通测试 | `ping www.baidu.com` |
| `ipconfig` | TCP/IP 信息 | `ipconfig /all` |
| `set /a` | 计算表达式 | `set /a 6%4` |
| `shutdown` | 关机 | `shutdown /s /t 60` |

### 文件操作

路径分隔符 `\`，当前目录 `.`，上级目录 `..`

| 命令 | 功能 | 举例 |
| :--- | :--- | :--- |
| `dir` | 列目录 | `dir /A` |
| `tree` | 树形结构 | `tree /F` |
| `盘符:` | 切换磁盘 | `d:` |
| `cd` | 切换目录 | `cd test`、`cd ..` |
| `mkdir` / `md` | 创建目录 | `mkdir test` |
| `rmdir` / `rd` | 删除目录 | `rmdir test` |
| `del` | 删除文件 | `del /q/a/f *.txt` |
| `rename` / `ren` | 重命名 | `ren a.txt b.txt` |
| `copy` | 复制 | `copy a\1.txt b\` |
| `move` | 移动/重命名 | `move a\1.txt 2.txt` |

### 多命令、重定向、管道

```bat
REM 多命令连接
a & b        REM 顺序执行，不管成败
a && b       REM a 成功才执行 b
a || b       REM a 失败才执行 b（碰到成功即停）

REM 重定向
date /t > 1.txt      REM 覆盖输出
time /t >> 1.txt     REM 追加输出
find "/" < 1.txt     REM 输入重定向

REM 管道
dir | find "txt"
```

> 注意：PowerShell 5.1 不支持 `&&`，要用 `;` 分隔——写脚本前先确认目标 shell。

## 二、批处理（.bat）

### 基本结构与运行

```bat
@echo off      REM 关闭回显
......
pause          REM 或 pause > nul
```

运行方式：双击，或在 cmd 中运行（后者可以传参）。

### 变量

```bat
set 变量名=变量值        REM 设置（= 两侧不要空格）
set /a 变量名=表达式     REM 数值计算
set /p 变量名=提示文字   REM 交互输入
set 变量名=              REM 取消变量
set 变量名               REM 打印变量
set                      REM 列出全部变量
%变量名%                 REM 引用变量
```

**预定义变量**：

| 变量 | 值 |
| :--- | :--- |
| `%cd%` | 当前目录 |
| `%date%` / `%time%` | 当前日期 / 时间 |
| `%random%` | 0~32767 随机数 |
| `%path%` | 环境变量 |
| `%errorlevel%` | 上一命令返回值，0 为成功 |
| `%0` `%1` `%2`… | 参数，`%0` 是命令名自身 |

### 条件与跳转

```bat
if [not] 条件 (
    语句块
) else (
    语句块
)

REM 常用条件：
REM errorlevel n          上一程序返回值 >= n
REM string1==string2      字符串相等
REM exist filename        文件存在
REM [/I] s1 equ s2        比较（/I 忽略大小写）
REM                       equ neq lss leq gtr geq
REM defined variable      变量已定义

goto label     REM 跳转
:label         REM 标签以冒号开头
```

### 循环（for）

循环变量用 `%%i`（脚本中）且只能单字母；命令行里直接用 `%i`。

```bat
for %%i in (a,b,c) do (echo %%i)     REM 遍历列表
for %%i in (*.*) do (echo %%i)       REM 遍历文件（支持通配符 ? *）
for /d %%i in (set) do ...           REM 只遍历文件夹
for /r [path] %%i in (set) do ...    REM 递归遍历
for /l %%i in (start,step,end) do ...REM 数字序列
for /f ["options"] %%i in (set) do ..REM 逐行读文件内容
```

### 实用示例：批量按序号重命名

```bat
@echo off
setlocal enabledelayedexpansion
set cnt=0
for %%i in (%1) do (
    rename %%i !cnt!.txt
    set /a cnt=!cnt! + 1
)
pause
```

> 要点：循环体内变量自增必须开 `enabledelayedexpansion` 并用 `!var!` 取值，`%var%` 在循环内取到的是进入循环前的旧值。
