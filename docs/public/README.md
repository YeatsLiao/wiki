# 静态资源目录规范

本目录（`docs/public/`）存放站点所有静态资源。VitePress 构建时会将其中内容原样拷贝到站点根路径，**引用时不带 `public` 前缀**，站点 base（`/wiki/`）会自动拼接。

## 目录结构

```
docs/public/
├── hero.jpg                     # 首页全屏 Hero 背景插画（站点级资源放根目录）
└── images/                      # 文章图片，目录镜像 docs/ 下的文章路径
    ├── series/                  # 原创系列
    │   └── cangjie-journey/     # 系列名与文章目录同名
    │       └── 05-project-structure.png
    └── translations/            # 翻译系列
        └── rxtx/
            └── install-wizard.png
```

## 存放规则

1. **站点级资源**（Hero 图、logo、favicon 等）直接放 `docs/public/` 根目录；
2. **文章图片**放 `docs/public/images/<文章相对路径>/`，即镜像 `docs/` 下的目录结构：
   - `docs/series/cangjie-journey/05-xxx.md` 的配图 → `docs/public/images/series/cangjie-journey/`
   - `docs/translations/rxtx/INSTALL.md` 的配图 → `docs/public/images/translations/rxtx/`
3. **文件命名**：小写英文 + 连字符；系列文章的图片以文章序号开头，便于对应，如 `05-project-structure.png`、`29-bom-bug-trace.png`；同一篇文章图片多时可再建子目录（如 `images/series/cangjie-journey/29/`）。

## 格式与尺寸建议

| 类型 | 格式 | 建议 |
|-----|------|-----|
| Hero / 封面插画 | jpg / webp | 16:9，≥1792×1024，单张 ≤ 500KB |
| 截图 | png / webp | 宽度 ≤ 1600px，单张 ≤ 300KB |
| 示意图 / 流程图 | svg 优先 | 矢量无损，体积小 |
| 照片 | jpg / webp | 压缩后 ≤ 300KB |

## Markdown 中引用

以 `/images/` 开头的绝对路径引用（**不写 `/wiki/` 前缀**，base 由 VitePress 自动处理）：

```markdown
![工程目录结构](/images/series/cangjie-journey/05-project-structure.png)
```

## 当前站点级资源清单

- `hero.jpg`：首页全屏 Hero 背景，特纳《威尼斯：海关署与圣乔治·马焦雷教堂》（已压缩至 2560×1440，约 650KB；原图备份在仓库根目录 `hero-original-backup.jpg`）。缺失时首页自动回退为深色星空渐变背景。
- `favicon.svg`：站点图标（圣乔治钟楼剪影，取自 Hero 画作主体），同时用作导航栏 logo；在 `config.mts` 的 `head` 与 `themeConfig.logo` 中引用。
