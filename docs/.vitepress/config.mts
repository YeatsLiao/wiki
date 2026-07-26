import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Yeats 的知识库',
  description: '原创系列与翻译系列文档集',
  base: '/wiki/',
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '翻译系列',
        items: [
          { text: 'RXTX 中文文档', link: '/translations/rxtx/' }
        ]
      }
    ],

    sidebar: {
      '/translations/rxtx/': [
        { text: '系列首页', link: '/translations/rxtx/' },
        {
          text: '入门',
          items: [
            { text: '项目简介', link: '/translations/rxtx/ProjectOverview' },
            { text: '安装指南', link: '/translations/rxtx/INSTALL' },
            { text: '串口使用教程', link: '/translations/rxtx/SerialPortInstructions' }
          ]
        },
        {
          text: '参考',
          items: [
            { text: '移植指南', link: '/translations/rxtx/Porting' },
            { text: '支持的构建主机', link: '/translations/rxtx/wiki/SupportedBuildHosts' },
            { text: '变更日志', link: '/translations/rxtx/ChangeLog' },
            { text: '常见问题', link: '/translations/rxtx/wiki/FAQ' },
            { text: '开发指南', link: '/translations/rxtx/wiki/Development' },
            { text: '下载资源', link: '/translations/rxtx/wiki/Download' }
          ]
        },
        {
          text: '关于',
          items: [
            { text: '贡献者名单', link: '/translations/rxtx/AUTHORS' },
            { text: '许可证摘要', link: '/translations/rxtx/LicenseSummary' },
            { text: '完整许可证', link: '/translations/rxtx/FullLicense' }
          ]
        },
        {
          text: '附录',
          items: [
            { text: '官方 Wiki 首页', link: '/translations/rxtx/wiki/Home' }
          ]
        }
      ]
    },

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdatedText: '最后更新',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '外观',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YeatsLiao/wiki' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    }
  }
})
