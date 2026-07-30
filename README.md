# Yeats' Wiki

个人知识库，收录系列化的翻译文档与原创技术文章，基于 [VitePress](https://vitepress.dev/zh/) 构建，通过 GitHub Actions 自动部署到 GitHub Pages。

**在线访问**：[https://yeatsliao.github.io/wiki/](https://yeatsliao.github.io/wiki/)

## 内容目录

### 原创系列

| 系列 | 说明 | 入口 |
|-----|------|------|
| 仓颉共建之旅 | 从零把 Java 库 dd-plist 移植为仓颉库 plist4cj 的完整记录（31 篇），覆盖环境搭建、逐模块翻译、PR 审核整改、发布中心仓全流程 | [在线阅读](https://yeatsliao.github.io/wiki/series/cangjie-journey/) |

### 翻译系列

| 系列 | 说明 | 入口 |
|-----|------|------|
| RXTX 中文文档 | Java 跨平台串口/并口通信库 RXTX 的完整中文翻译（14 篇） | [在线阅读](https://yeatsliao.github.io/wiki/translations/rxtx/) |

## 目录结构

```
docs/
├── .vitepress/         # 站点配置（导航、侧边栏、搜索等）
│   ├── config.mts
│   └── theme/          # 自定义主题（首页组件、全局样式）
├── public/             # 静态资源（规范见 docs/public/README.md）
│   ├── hero.jpg        # 首页 Hero 插画
│   └── images/         # 文章图片，目录镜像文章路径
│       ├── series/cangjie-journey/
│       └── translations/rxtx/
├── index.md            # 门户首页
├── series/             # 原创系列
│   └── cangjie-journey/ # 仓颉共建之旅
└── translations/       # 翻译系列
    └── rxtx/           # RXTX 中文文档
```

新增一个系列：在对应目录下新建系列文件夹放入 Markdown 文件，并在 `docs/.vitepress/config.mts` 中添加 nav 入口和 sidebar 配置。

文章配图：放入 `docs/public/images/` 下与文章路径对应的目录，Markdown 中以 `/images/...` 绝对路径引用（不带 `/wiki/` 前缀），详细规范见 [docs/public/README.md](docs/public/README.md)。

## 本地开发

需要 Node.js 18 及以上版本。

```bash
npm install          # 安装依赖
npm run docs:dev     # 启动开发服务器（热更新）
npm run docs:build   # 构建静态站点
npm run docs:preview # 本地预览构建产物
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布到 GitHub Pages（见 `.github/workflows/deploy.yml`）。

## 许可说明

- 翻译系列遵循各自原项目的许可证（如 RXTX 文档遵循 LGPL v2.1），以英文原版为准
- 原创内容版权归作者所有

---

*由 [YeatsLiao](https://github.com/YeatsLiao) 维护，欢迎提 Issue 指正错误或改进翻译。*
