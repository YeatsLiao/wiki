# xlsx 总是变 xlsm 排查记：一次 Synaptics 宏病毒的发现与清除

> 技术栈：Windows + Office + PowerShell
> 适用场景：Office 文件莫名从 xlsx 变成 xlsm、打开后一片空白，怀疑中了宏病毒

## 1. 问题背景

现象很具体，也很容易被当成"Excel 的毛病"：

- 手里的 `.xlsx` 表格，另存一下就变成了 `.xlsm`（启用宏的格式）；
- 打开这些 xlsm，看到的却是一张**空白表**，原来的数据"消失"了；
- 反复设置默认保存格式也没用，过一阵又变回 xlsm。

最初我以为是"文件带了宏所以 Excel 不让存 xlsx"这类设置问题。直到把文件拆开看，才发现根因是——**电脑感染了 Synaptics 宏蠕虫**。所有 xlsx 变 xlsm，都是病毒在你每次打开 Office 文件时自动注入宏、强制另存的结果。

## 2. 病毒真相：一个伪装成驱动的后门

它借用了笔记本触摸板驱动"Synaptics"的名字伪装自己。很多人第一反应是"它好像就改改文件"——其实**文件感染只是它铺开传播的外壳，真正身份是「后门 + 键盘记录器 + 下载器」三合一**。

### 2.1 传播外壳：你能直接看到的部分

**（1）文档感染。** 你用 Excel 打开任意工作簿时，病毒的 `Workbook_Open` 宏会读取原表内容，与病毒资源里的 `.xlsm` 模板合并成一个新的启用宏文件，替换原文件。新文件"自动启用所有宏"，下次打开无需确认就再次执行。

**（2）藏数据骗人。** 被感染文件里，真实数据表被设成 `state="hidden"`（隐藏），只留一张空表可见并设为活动表。宏运行时才把数据表取消隐藏——你禁用宏，就永远只看到空白表。

**（3）篡改系统。** 释放 `C:\ProgramData\Synaptics\Synaptics.exe`（伪装成"Synaptics Pointing Device Driver"），写入注册表开机自启，并把 Office 宏安全级别偷偷改成"静默启用所有宏"（`VBAWarnings=1`）、开启 `AccessVBOM`。

**（4）多渠道传播。** 除了 Office 文档，它还会感染 `.exe`（释放 `._cache_原名.exe`）、监听 USB，插入 U 盘时感染其中的 exe 和 xlsx 并写入 `Autorun.inf`，同时在后台持续联网。

### 2.2 真正目的：从病毒本体挖出的证据

光看文件感染会低估它。把常驻的 `Synaptics.exe`（Delphi 编写）提取字符串，就能看清它的真实意图——这与安全圈记录的 **"XRed" 后门**家族特征一致：

**（1）可复原的 C2（命令控制）。** 内置动态域名，服务器 IP 换了域名依旧有效：

```
xred.mooo.com
http://freedns.afraid.org/api/?action=getdyndns&sha=****   # 用 FreeDNS 免费动态域名保活
```

**（2）三路冗余下载第二阶段载荷。** Dropbox、Google、自建站互为备份，一处失效换下一处：

```
https://www.dropbox.com/s/****/SUpdate.ini?dl=1        # 更新指令/配置
https://www.dropbox.com/s/****/Synaptics.rar?dl=1      # 主体载荷
https://www.dropbox.com/s/****/SSLLibrary.dll?dl=1     # 依赖库
# 另有 Google Docs 镜像与 http://xred.site50.net/syn/ 镜像
```

**（3）Gmail SMTP 数据外发通道（最要命）。** 它内置发信能力和攻击者收件邮箱，具备把按键记录、文件信息打包成邮件回传的能力：

```
smtp.gmail.com
xredline1@gmail.com ; xredline2@gmail.com ; xredline3@gmail.com
```

**结论：** 它绝不是恶作剧。文件感染只为传播扩散，真正目的是**长期潜伏、回传数据、按需再下载更多恶意程序**。所谓"只改了改文件"，往往是因为它的老下载链接（2020 年前后的样本）已失效、第二阶段没下下来，你只看到了传播层的动静；但外发与键盘记录能力仍在，绝不能因"看起来无害"而放着不管。

> 关于泄露的判断：静态字符串只能证明它**具备**外发能力，无法证明历史上**真的发出去过**多少（需联网/邮件服务器日志才能确认）。稳妥起见应按"可能已泄露"处理——见第 7 节。

## 3. 如何辨别自己是否中招

从"系统层面"和"文件层面"两头查：

**（1）系统层面。**

- 打开任务管理器，看有没有 `Synaptics` 进程（真触摸板驱动一般是 `SynTPEnh`，名字不完全一样）；
- 进入 `C:\ProgramData\Synaptics\`，若有 `Synaptics.exe` 基本可判定；
- 在"文件夹选项"里取消勾选"隐藏受保护的操作系统文件"、勾选"显示隐藏文件"，到桌面/我的文档/下载里找前缀为 `._cache_` 的可执行文件或表格；
- 查注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 有无"Synaptics Pointing Device Driver"项；查 `HKCU\Software\Microsoft\Office\<版本>\<Excel/Word>\Security` 的 `VBAWarnings` 是否被改成 1。

**（2）文件层面（最可靠）。** `.xlsx/.xlsm` 本质是 zip 包，直接查它内部有没有恶意宏。用 PowerShell 打开检查是否含 `xl/vbaProject.bin`，并把这段二进制按 ASCII 提取字符串，若出现 `Synaptics`、`VBAWarnings`、Dropbox/Google 下载链接、`~$cache1` 等特征即确认感染：

```powershell
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead($path)
$vba = $z.Entries | Where-Object { $_.FullName -eq 'xl/vbaProject.bin' }
# 读取 $vba 内容按 ASCII 提取字符串，匹配 Synaptics / VBAWarnings 即感染
$z.Dispose()
```

## 4. 清除病毒本体

顺序很重要：先断掉运行和自启，再隔离文件、修复设置。以下操作需管理员权限。

**（1）结束进程 + 删自启 + 隔离本体。**

```powershell
Stop-Process -Name Synaptics -Force                                   # 结束病毒进程
Remove-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' `
  -Name 'Synaptics Pointing Device Driver'                            # 删除开机自启项
# 病毒目录常拒绝直接删除，改为给 exe 加 .virus 后缀使其无法执行
Rename-Item 'C:\ProgramData\Synaptics\Synaptics.exe' 'Synaptics.exe.virus'
```

**（2）修复被篡改的 Office 宏设置。** 把宏警告改回"禁用并通知"，关闭对 VBA 工程的编程访问：

```powershell
Set-ItemProperty 'HKCU:\Software\Microsoft\Office\16.0\Word\Security'  -Name VBAWarnings -Value 2
Set-ItemProperty 'HKCU:\Software\Microsoft\Office\16.0\Excel\Security' -Name AccessVBOM   -Value 0
```

**（3）排查其他持久化。** 确认没有名字或指向含 `Synaptics` 的计划任务、`HKLM\...\Run` 项、启动文件夹快捷方式，以及 `%TEMP%`、`%APPDATA%` 下的同名 exe。

## 5. 批量脱毒被感染的文档

好消息是：正常被感染的文件**数据仍然完好**（只是被藏起来了），可以无损救回。原理是在 zip 层面做四件事，另存为干净的 xlsx：

```powershell
$zip = [IO.Compression.ZipFile]::Open($dst, [IO.Compression.ZipArchiveMode]::Update)
# 1) 取消工作表隐藏：workbook.xml 里删除 state="hidden" / "veryHidden"
# 2) 删除宏工程：删掉 xl/vbaProject.bin
# 3) 改回标准类型：[Content_Types].xml 把 macroEnabled 类型换成标准 sheet 类型，移除 vba 声明
# 4) 断开引用：workbook.xml.rels 移除指向 vbaProject 的 Relationship
$zip.Dispose()
```

处理时的两个实战注意点：

- **原件先隔离再清理。** 把感染的 xlsm 移到隔离目录留底，生成的干净 xlsx 放回原处，可回退；
- **PowerShell 辅助函数别叫 `RD`/`WR`。** `rd` 是 `Remove-Item` 的内置别名，别名解析优先级高于函数，会导致调用被识别成删除命令而报错——我第一次就踩了这个坑。

清理完务必逐个验证：**无 `vbaProject`、`[Content_Types].xml` 不含 `macroEnabled`、隐藏表数为 0**，三项都通过才算干净。

## 6. 现成的查杀 / 恢复工具

如果不想手动处理，吾爱破解社区有大佬做了专门的全盘扫描恢复工具，可以批量恢复被感染的 exe 和 xlsx，参考出处：

- 路明笔记《如何正确预防 Synaptics 蠕虫病毒》，附恢复工具下载：<https://www.luming.cool/posts/2023/07/wp-187>
- 吾爱破解论坛《Synaptics 宏病毒感染排查》讨论帖，含"全盘 U 盘病毒 Synaptics 查杀 恢复 exe 和 xlsx 文件"工具：<https://www.52pojie.cn/thread-1066827-1-1.html>

> 提示：来路不明的 exe 工具请在虚拟机或隔离环境先验证；对重要文件，手动 zip 脱毒法（第 5 节）更可控、可审计。

## 7. 注意事项

**（1）别轻易启用宏。** 来路不明的 xlsm/docm 打开时若提示"启用内容/启用宏"，一律不要点。这类文件的数据即使看不到，也能用第 5 节的方法从 zip 里救出来，不需要运行宏。

**（2）检查所有存储介质。** 病毒通过 U 盘传播，清理主机后，插过的每个 U 盘、移动硬盘都要查一遍 `Autorun.inf` 和 `._cache_` 文件；云盘同步目录、`.doc/.xls` 老格式文件也在感染范围内。

**（3）当心已外发的文件。** 如果被感染文件曾通过 U 盘、聊天软件、邮件发给他人，对方大概率也已中招，应及时提醒。

**（4）按"可能已泄露"改密码。** 因它带键盘记录 + 邮件外发能力，应在**另一台干净设备**上，修改感染期间在本机登录过的重要账号密码（邮箱、网银、常用平台），并给关键账号开启两步验证。这一条比清病毒本身更重要。

**（5）收尾兜底。** 手动清除后，建议再用杀毒软件做一次全盘扫描，清理可能遗漏的变种或 `~$cache1.exe` 之类残留。

## 8. 总结

| 环节 | 表象 | 真正原因 | 处理 |
| --- | --- | --- | --- |
| xlsx 变 xlsm | 以为是 Excel 设置 | 病毒每次打开文档注入宏并强制另存 | 清除病毒本体 |
| 打开是空白 | 以为数据丢了 | 真实数据表被设为隐藏 | zip 层取消隐藏 |
| 反复复发 | 以为没删干净 | 进程常驻 + 开机自启 + 宏设置被改 | 杀进程 / 删自启 / 修注册表 |
| 文档带毒 | 单个文件难处理 | 宏工程注入到每个被打开的文件 | 批量 zip 脱毒转 xlsx |
| 后台联网 | 以为无害 | 后门回传数据 + 按需下载二阶段 | 断自启断联网 + 按"可能已泄露"改密码 |

一句话：**当"xlsx 总是变 xlsm、打开还是空白"同时出现，几乎可以断定不是 Office 出了问题，而是中了 Synaptics 宏蠕虫**。文件本质是 zip，看懂它的内部结构，无需任何专杀工具也能把数据完好救回。

## 附录：IOC 特征清单

用于自查或分享给他人比对。命中任一项即应高度怀疑感染。

**（1）进程与文件**

```
C:\ProgramData\Synaptics\Synaptics.exe   （Delphi 编写，伪装 "Synaptics Pointing Device Driver"）
Synaptics.dll～Synaptics.exe 进程
~$cache1.exe～._cache_*.exe   （隐藏属性，常在桌面/我的文档/下载）
U 盘根目录 Autorun.inf
```

**（2）注册表**

```
HKCU\Software\Microsoft\Windows\CurrentVersion\Run  值名 "Synaptics Pointing Device Driver"
HKCU\...\Office\<版本>\Excel(或 Word)\Security  VBAWarnings=1、AccessVBOM=1
```

**（3）网络（C2 / 下载 / 外发）**

```
域名/C2 : xred.mooo.com 、 freedns.afraid.org/api/?action=getdyndns&sha=****
下载源 : *.dropbox.com/s/****/{SUpdate.ini, Synaptics.rar, SSLLibrary.dll}
           docs.google.com/uc?id=****&export=download
           xred.site50.net/syn/
邮件外发 : smtp.gmail.com 、 xredline1@gmail.com 、 xredline2@gmail.com 、 xredline3@gmail.com
```

**（4）文档内部特征**

```
存在 xl/vbaProject.bin（或 word/vbaProject.bin），且其中含 Synaptics / VBAWarnings 字符串
工作表被设为 state="hidden" / "veryHidden"，仅留一张空表可见
文件类型被强制变为 macroEnabled（.xlsm/.docm）
```

> 参考出处：路明笔记 <https://www.luming.cool/posts/2023/07/wp-187>、吾爱破解 <https://www.52pojie.cn/thread-1066827-1-1.html>。本文病毒行为描述综合上述资料与本人实测，清理脚本为本人在真实环境中验证通过的方法。
