# Yeats 的知识库

个人知识库，收录系列化的翻译文档与原创技术文章，基于 [VitePress](https://vitepress.dev/zh/) 构建，通过 GitHub Actions 自动部署到 GitHub Pages。

**在线访问**：[https://yeatsliao.github.io/wiki/](https://yeatsliao.github.io/wiki/)

## 内容目录

### 翻译系列

| 系列 | 说明 | 入口 |
|-----|------|------|
| RXTX 中文文档 | Java 跨平台串口/并口通信库 RXTX 的完整中文翻译（14 篇） | [在线阅读](https://yeatsliao.github.io/wiki/translations/rxtx/) |

### 原创系列

筹备中，敬请期待。

## 目录结构

```
docs/
├── .vitepress/         # 站点配置（导航、侧边栏、搜索等）
│   └── config.mts
├── index.md            # 门户首页
├── translations/       # 翻译系列
│   └── rxtx/           # RXTX 中文文档
└── series/             # 原创系列（规划中）
```

新增一个系列：在对应目录下新建系列文件夹放入 Markdown 文件，并在 `docs/.vitepress/config.mts` 中添加 nav 入口和 sidebar 配置。

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
