# Linux 常用操作速查

> 适用：CentOS 7+ / RHEL 系（firewalld）。Ubuntu 的 ufw 语法不同，条目内标注。

## 一、防火墙与端口（firewalld）

### 状态管理

| 场景 | 命令 |
| :--- | :--- |
| 查看防火墙状态 | `systemctl status firewalld` |
| 启动防火墙 | `systemctl start firewalld` |
| 重启防火墙 | `systemctl restart firewalld` |
| 重载配置（改完端口必执行） | `firewall-cmd --reload` |

### 端口开放与关闭

| 场景 | 命令 |
| :--- | :--- |
| 查看已开放的临时端口 | `firewall-cmd --list-ports` |
| 查看永久开放的端口 | `firewall-cmd --list-ports --permanent` |
| 临时开放端口（重启失效） | `firewall-cmd --add-port=223/tcp` |
| 永久开放端口 | `firewall-cmd --add-port=223/tcp --permanent` |
| 关闭临时端口 | `firewall-cmd --remove-port=80/tcp` |
| 关闭永久端口 | `firewall-cmd --remove-port=80/tcp --permanent` |

**注意**：

- 带 `--permanent` 的修改不会立即生效，必须 `firewall-cmd --reload`
- 典型场景：修改 ssh 端口为 223 后，先永久开放 223 再重载，确认能连上新端口后再关 22，顺序反了会把自己锁在外面

## 二、rm 安全守则

血泪经验，条条来自生产事故：

1. **`rm -rf` 与路径之间的空格是致命的**：`rm -rf /etc/abc` 没问题，`rm -rf /etc/ abc` 会先删光 `/etc/` —— 目录名禁止带空格，若有必须加引号
2. **删除走程序接口，不走命令行**：生产文件的清理应通过应用逻辑或运维平台执行，留审计记录
3. **rm 权限要收口**：生产机的 rm 应受权限管控，重要目录的删除需要审批流程
4. **能 mv 不 rm**：先移动到回收目录观察一段时间，确认无影响再真删

## 三、跨系统操作注意

- **不要把 Windows 里复制的命令直接粘进 Linux 终端**：可能携带不可见换行符、全角字符，导致命令被截断或参数错乱；先粘到纯文本编辑器过一遍
- 备份策略三件套：**同步备份、同步延迟备份、增量备份**——延迟备份可以救回「同步备份把误删也同步了」的场景

## 四、内核态与用户态（面试速答）

- **内核态**：最高权限，直接访问硬件（磁盘/内存/网络），可执行特权指令
- **用户态**：受限访问，操作硬件必须走系统调用，由内核代为执行
- 切换有开销，高性能程序（如零拷贝）的优化思路就是减少态切换次数
