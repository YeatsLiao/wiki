# Docker 速查

> 覆盖：安装、时区问题、数据挂载守则。均为实际部署踩过的点。

## 一、安装

### CentOS 7

```bash
# 1. 依赖（yum-utils 提供 yum-config-manager，后两个是 devicemapper 驱动依赖）
yum install -y yum-utils device-mapper-persistent-data lvm2

# 2. 添加阿里云源
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 3. 查看可安装版本
yum list docker-ce --showduplicates | sort -r

# 4. 安装指定版本
yum -y install docker-ce-20.10.7

# 5. 启动并设置开机自启
systemctl start docker
systemctl enable docker
```

### Ubuntu

```bash
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker
```

### 验证安装

```bash
docker run --name nginx1 -d -p 8080:80 nginx
# 浏览器访问 8080 端口能看到 nginx 欢迎页即成功
```

## 二、容器时区问题（数据库容器高发）

**症状**：容器内时间与宿主机差 8 小时，数据库时间戳全部错位。

**排查**：

```bash
docker exec -it <容器ID> bash
date    # 与宿主机对比
```

**三种解法**（按推荐顺序）：

| 方案 | 命令 | 说明 |
| :--- | :--- | :--- |
| 运行时挂载时区文件 | `docker run -v /etc/localtime:/etc/localtime` | 与宿主机时区永久一致，推荐 |
| 运行时传环境变量 | `docker run -e TZ="Asia/Shanghai"` | 依赖镜像内 tzdata |
| Dockerfile 内置 | `RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo 'Asia/Shanghai' > /etc/timezone` | 自建镜像时一次解决 |

**注意**：已运行的容器改时区需要删掉重建——所以第一次 run 就把时区参数带上。

## 三、数据挂载守则

- **所有配置和数据一律 `-v` 挂载到宿主机**。容器随时可以删掉重建（比如上面的时区问题），挂载在外的数据不受影响
- stop / rm 容器前，先确认数据和配置是否都在挂载卷里
- 数据库容器部署完，第一件事检查 `date` 时区是否正确，别等业务数据错位了才发现
