<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

// 系列条目数据（完整清单，首页每个分类只展示前两条）
const seriesList = [
  {
    tag: '原创系列',
    count: '31 篇',
    title: '仓颉共建之旅',
    desc: '从零把 Java 库 dd-plist 移植为仓颉库 plist4cj 的完整记录：环境搭建、逐模块翻译、两轮 PR 审核整改，直到发布仓颉中心仓。',
    link: '/series/cangjie-journey/'
  },
  {
    tag: '原创系列',
    count: '23 篇',
    title: '23 种设计模式实战',
    desc: '用大白话和 Java 实战代码讲透 GoF 的 23 种设计模式，配套 React 交互演示站，边读文章边动手玩。',
    link: '/series/design-patterns/'
  },
  {
    tag: '原创系列',
    count: '6 篇',
    title: 'Java启动速度优化解读',
    desc: '从类加载、AppCDS、Heap Archive 到 JIT/AOT 与 Spring 懒加载实战，把 Java 启动慢的根因与加速方案一次讲透。',
    link: '/series/java-startup-optimization/'
  },
  {
    tag: '原创系列',
    count: '5 篇',
    title: '物联网平台SQL治理手记',
    desc: '手写 MyBatis SQL 的隐患全景：从 SQL 注入、select * 到深分页与死代码，每篇都给出可落地的改造方案。',
    link: '/series/iot-sql-governance/'
  },
  {
    tag: '原创系列',
    count: '4 篇',
    title: '.NET构建机制剖析',
    desc: '拆开 Visual Studio 构建黑盒：Debug/Release 本质差异、增量构建判定、Design-Time Build 与彻底清理的工程化方案。',
    link: '/series/dotnet-build/'
  },
  {
    tag: '原创系列',
    count: '6 篇',
    title: '开发者速查手册',
    desc: 'Linux、Windows 命令行、Docker、Git、网络基础与编码自检：表格 + 命令 + 最小示例，打开就能抄。',
    link: '/series/handbook/'
  },
  {
    tag: '随笔',
    count: '6 篇',
    title: '随笔',
    desc: '一个后端开发在技术之外的成长笔记：求职面试、读书、产品思维、认知方法与兴趣清单。',
    link: '/essays/'
  },
  {
    tag: '原创系列',
    count: '3 篇',
    title: '技术手记单篇',
    desc: '不成系列的实战与排查记录：OutfitAnyone 部署实录与开源可复现性分析、Synaptics 宏病毒清除、Git 合并冲突实战。',
    link: '/series/tech-notes/'
  },
  {
    tag: '翻译系列',
    count: '13 篇',
    title: 'RXTX 中文文档',
    desc: 'Java 跨平台串口、并口开源库 RXTX 的完整中文翻译，含安装指南、串口教程、移植指南与常见问题。',
    link: '/translations/rxtx/'
  }
]

// 更多入口：跳转全部文集页
const moreEntry = {
  tag: '目录',
  count: '共 9 辑',
  title: '更多系列',
  desc: '速查手册、手记、翻译与在线实验，完整目录按分类收录，陆续更新。',
  link: '/collections'
}

// 首页展示：只取前两条，末尾跟「更多系列」跳转条
const displayedSeries = computed(() => [...seriesList.slice(0, 2), moreEntry])

// 在线实验条目数据（外链到独立部署的交互式站点）
const labsList = [
  {
    tag: '交互演示',
    title: '设计模式交互演示站',
    desc: '23 种设计模式的可视化演示平台，每种模式都能亲手操作、观察运行逻辑，与「23 种设计模式实战」系列配套。',
    link: 'https://yeatsliao.github.io/design-patterns-23/'
  },
  {
    tag: '交互演示',
    title: 'Java 可视化实验室',
    desc: '把内存模型、垃圾回收、多线程竞争、集合扩容等抽象概念做成可操作的动画实验，直观理解 Java 运行机制。',
    link: 'https://yeatsliao.github.io/java-handson-lab/'
  }
]
</script>

<template>
  <div class="home-page">
    <!-- 全屏 Hero：标题居左下，编辑式排版 -->
    <section class="hero" :style="{ '--hero-image': `url(${withBase('/hero.jpg')})` }">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-inner">
        <h1 class="hero-title">Yeats' Wiki.</h1>
      </div>
      <p class="hero-credit">背景：《威尼斯：海关署与圣乔治·马焦雷教堂》 · J.M.W. 特纳</p>
    </section>

    <!-- 系列文集：左标题 + 右侧画廊索引式条目，细线串联 -->
    <section class="series">
      <div class="series-head">
        <h2 class="section-title">系列文集。</h2>
        <p class="section-note">原创与翻译，按辑收录。</p>
      </div>
      <div class="series-list">
        <template v-for="s in displayedSeries" :key="s.title">
          <a v-if="s.link" class="series-entry" :href="withBase(s.link)">
            <div class="entry-main">
              <h3 class="entry-title">{{ s.title }}</h3>
              <p class="entry-desc">{{ s.desc }}</p>
            </div>
            <div class="entry-side">
              <div class="entry-meta">
                <span class="pill">{{ s.tag }}</span>
                <span v-if="s.count" class="entry-count">{{ s.count }}</span>
              </div>
              <span class="entry-arrow" aria-hidden="true">→</span>
            </div>
          </a>
          <div v-else class="series-entry is-muted">
            <div class="entry-main">
              <h3 class="entry-title">{{ s.title }}</h3>
              <p class="entry-desc">{{ s.desc }}</p>
            </div>
            <div class="entry-side">
              <div class="entry-meta">
                <span class="pill">{{ s.tag }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- 在线实验：与系列文集同构的画廊索引，条目外链到独立部署的演示站 -->
    <section class="series">
      <div class="series-head">
        <h2 class="section-title">在线实验。</h2>
        <p class="section-note">可交互的学习平台，动手优于旁观。</p>
      </div>
      <div class="series-list">
        <a
          v-for="l in labsList"
          :key="l.title"
          class="series-entry"
          :href="l.link"
          target="_blank"
          rel="noopener"
        >
          <div class="entry-main">
            <h3 class="entry-title">{{ l.title }}</h3>
            <p class="entry-desc">{{ l.desc }}</p>
          </div>
          <div class="entry-side">
            <div class="entry-meta">
              <span class="pill">{{ l.tag }}</span>
            </div>
            <span class="entry-arrow" aria-hidden="true">↗</span>
          </div>
        </a>
      </div>
    </section>

    <!-- 个人区：平涂色块，左对齐横排 -->
    <section class="profile">
      <div class="profile-inner">
        <img class="profile-avatar" src="https://github.com/YeatsLiao.png" alt="Yeats Liao" loading="lazy" />
        <div class="profile-name">Yeats Liao</div>
        <div class="profile-links">
          <a class="pill-button" href="https://yeatsliao.github.io" target="_blank" rel="noopener">个人主页</a>
          <a class="pill-outline" href="https://github.com/YeatsLiao" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---------- Hero ---------- */
.hero {
  position: relative;
  height: calc(100vh - var(--vp-nav-height));
  min-height: 480px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

/* 背景：暖调渐变兜底，hero.jpg 存在时覆盖其上 */
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    var(--hero-image) center / cover no-repeat,
    radial-gradient(ellipse at 70% 25%, rgba(196, 168, 118, 0.30), transparent 55%),
    radial-gradient(ellipse at 25% 75%, rgba(138, 84, 51, 0.22), transparent 50%),
    linear-gradient(165deg, #23364c 0%, #3d4a56 55%, #6b5c46 100%);
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  /* 底部压暗承载左下标题 */
  background: linear-gradient(180deg, rgba(20, 22, 28, 0.10) 0%, rgba(20, 22, 28, 0) 25%, rgba(20, 22, 28, 0.60) 100%);
}

.hero-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 32px 72px;
}

/* 巨型左对齐标题，Regular 字重，靠字号建立层级 */
.hero-title {
  margin: 0;
  font-size: clamp(40px, 6.5vw, 76px);
  font-weight: 400;
  line-height: 1.08;
  letter-spacing: 0.01em;
  color: #f7f3ea;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.45);
}

.hero-tagline {
  margin: 18px 0 0;
  font-size: 16px;
  font-weight: 400;
  color: rgba(247, 243, 234, 0.85);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
}

/* 背景画作出处标注（仅大屏显示） */
.hero-credit {
  position: absolute;
  right: 20px;
  bottom: 14px;
  z-index: 1;
  margin: 0;
  font-size: 12px;
  color: rgba(247, 243, 234, 0.65);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
  display: none;
}

@media (min-width: 960px) {
  .hero-credit {
    display: block;
  }
}

/* ---------- 系列文集：左标题 + 右索引 ---------- */
.series {
  max-width: 1152px;
  margin: 0 auto;
  padding: 112px 32px 48px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px 72px;
  align-items: start;
}

.series-head {
  position: sticky;
  top: calc(var(--vp-nav-height) + 32px);
}

.section-title {
  margin: 0;
  font-size: clamp(34px, 5vw, 56px);
  font-weight: 400;
  line-height: 1.1;
  color: var(--vp-c-text-1);
}

.section-note {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.series-list {
  border-top: 1px solid var(--vp-c-divider);
}

/* 索引行：整行可点，细线分隔，左正文右元信息 */
.series-entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 34px 0;
  border-bottom: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit;
}

.series-entry.is-muted {
  opacity: 0.55;
}

.entry-title {
  margin: 0;
  font-size: clamp(22px, 2.6vw, 30px);
  font-weight: 400;
  line-height: 1.25;
  color: var(--vp-c-text-1);
  transition: color 0.3s ease;
}

a.series-entry:hover .entry-title {
  color: var(--vp-c-brand-1);
}

/* 描述限宽，右侧留白 */
.entry-desc {
  margin: 12px 0 0;
  max-width: 520px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--vp-c-text-2);
}

.entry-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pill {
  display: inline-block;
  padding: 4px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 30px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--vp-c-text-2);
  transition: border-color 0.3s ease;
}

a.series-entry:hover .pill {
  border-color: var(--vp-c-brand-1);
}

.entry-count {
  font-size: 12px;
  white-space: nowrap;
  color: var(--vp-c-text-3);
}

.entry-arrow {
  font-size: 20px;
  line-height: 1;
  color: var(--vp-c-text-3);
  transition: color 0.3s ease;
}

a.series-entry:hover .entry-arrow {
  color: var(--vp-c-brand-1);
}

/* ---------- 胶囊按钮 ---------- */
.pill-button {
  display: inline-block;
  margin-top: 24px;
  padding: 9px 26px;
  border: 1px solid var(--vp-c-text-1);
  border-radius: 30px;
  font-size: 14px;
  color: var(--vp-c-bg);
  background: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.pill-button:hover {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}

.pill-outline {
  display: inline-block;
  margin-top: 24px;
  padding: 9px 26px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 30px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  background: transparent;
  text-decoration: none !important;
  transition: border-color 0.3s ease;
}

.pill-outline:hover {
  border-color: var(--vp-c-brand-1);
}

/* ---------- 个人区：平涂色块 ---------- */
.profile {
  margin-top: 64px;
  background: var(--vp-c-brand-soft);
}

.profile-inner {
  max-width: 1152px;
  margin: 0 auto;
  padding: 72px 32px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
}

.profile-name {
  font-size: 24px;
  font-weight: 400;
  color: var(--vp-c-text-1);
}

.profile-links {
  display: flex;
  gap: 14px;
  margin-left: auto;
}

.profile-links .pill-button,
.profile-links .pill-outline {
  margin-top: 0;
}

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  .series {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 72px 24px 32px;
  }
  .series-head {
    position: static;
  }
  .series-entry {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 28px 0;
  }
  .entry-side {
    flex-direction: row;
    align-items: center;
    order: -1; /* 小屏上元信息提到标题上方 */
  }
  .hero-inner {
    padding: 0 24px 56px;
  }
  .profile-inner {
    padding: 56px 24px;
  }
  .profile-links {
    margin-left: 0;
    width: 100%;
  }
}
</style>
