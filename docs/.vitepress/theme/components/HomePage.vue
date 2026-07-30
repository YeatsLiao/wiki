<script setup lang="ts">
import { withBase } from 'vitepress'

// 系列条目数据
const seriesList = [
  {
    tag: '原创系列',
    count: '31 篇',
    title: '仓颉共建之旅',
    desc: '从零把 Java 库 dd-plist 移植为仓颉库 plist4cj 的完整记录：环境搭建、逐模块翻译、两轮 PR 审核整改，直到发布仓颉中心仓。',
    link: '/series/cangjie-journey/'
  },
  {
    tag: '翻译系列',
    count: '13 篇',
    title: 'RXTX 中文文档',
    desc: 'Java 跨平台串口、并口开源库 RXTX 的完整中文翻译，含安装指南、串口教程、移植指南与常见问题。',
    link: '/translations/rxtx/'
  },
  {
    tag: '待续',
    count: '',
    title: '更多系列',
    desc: '更多原创技术系列与开源项目文档翻译，陆续更新。',
    link: ''
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
        <template v-for="s in seriesList" :key="s.title">
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
