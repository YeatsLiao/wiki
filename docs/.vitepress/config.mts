import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: "Yeats' Wiki",
  description: '原创系列与翻译系列文档集',
  base: '/wiki/',
  lastUpdated: true,

  head: [
    // head 中的路径不会自动拼接 base，需手写 /wiki/ 前缀
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/wiki/favicon.svg' }]
  ],

  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: '首页', link: '/' },
      {
        text: '原创系列',
        items: [
          { text: '仓颉共建之旅', link: '/series/cangjie-journey/' }
        ]
      },
      {
        text: '翻译系列',
        items: [
          { text: 'RXTX 中文文档', link: '/translations/rxtx/' }
        ]
      }
    ],

    sidebar: {
      '/series/cangjie-journey/': [
        { text: '系列首页', link: '/series/cangjie-journey/' },
        {
          text: '第一部分：准备篇',
          collapsed: false,
          items: [
            { text: '01 读懂仓颉三方库共建计划', link: '/series/cangjie-journey/01-读懂仓颉三方库共建计划' },
            { text: '02 搭建仓颉开发环境', link: '/series/cangjie-journey/02-搭建仓颉开发环境' },
            { text: '03 认识 dd-plist 这个库', link: '/series/cangjie-journey/03-认识dd-plist这个库' },
            { text: '04 源码通读与移植规划', link: '/series/cangjie-journey/04-源码通读与移植规划' },
            { text: '05 搭建工程翻译第一个模块', link: '/series/cangjie-journey/05-搭建工程翻译第一个模块' }
          ]
        },
        {
          text: '第二部分：叶子类型篇',
          collapsed: true,
          items: [
            { text: '06 翻译 NSObject 与 NSString', link: '/series/cangjie-journey/06-翻译NSObject与NSString' },
            { text: '07 翻译 NSNumber', link: '/series/cangjie-journey/07-翻译NSNumber' },
            { text: '08 翻译 NSData', link: '/series/cangjie-journey/08-翻译NSData' },
            { text: '09 翻译 NSDate', link: '/series/cangjie-journey/09-翻译NSDate' },
            { text: '10 翻译 UID', link: '/series/cangjie-journey/10-翻译UID' },
            { text: '11 翻译 NSNull', link: '/series/cangjie-journey/11-翻译NSNull' }
          ]
        },
        {
          text: '第三部分：容器类型篇',
          collapsed: true,
          items: [
            { text: '12 翻译 NSArray', link: '/series/cangjie-journey/12-翻译NSArray' },
            { text: '13 翻译 NSDictionary', link: '/series/cangjie-journey/13-翻译NSDictionary' },
            { text: '14 翻译 NSSet', link: '/series/cangjie-journey/14-翻译NSSet' }
          ]
        },
        {
          text: '第四部分：工具与写出器篇',
          collapsed: true,
          items: [
            { text: '15 翻译 BinaryLocationInformation', link: '/series/cangjie-journey/15-翻译BinaryLocationInformation' },
            { text: '16 翻译 ASCIILocationInformation', link: '/series/cangjie-journey/16-翻译ASCIILocationInformation' },
            { text: '17 翻译 ParsedObjectStack', link: '/series/cangjie-journey/17-翻译ParsedObjectStack' },
            { text: '18 翻译 ByteOrderMarkReader', link: '/series/cangjie-journey/18-翻译ByteOrderMarkReader' },
            { text: '19 翻译 XMLPropertyListWriter', link: '/series/cangjie-journey/19-翻译XMLPropertyListWriter' },
            { text: '20 翻译 ASCIIPropertyListWriter', link: '/series/cangjie-journey/20-翻译ASCIIPropertyListWriter' },
            { text: '21 翻译 BinaryPropertyListWriter', link: '/series/cangjie-journey/21-翻译BinaryPropertyListWriter' },
            { text: '22 翻译 XMLLocationInformation', link: '/series/cangjie-journey/22-翻译XMLLocationInformation' },
            { text: '23 翻译 PropertyListParser', link: '/series/cangjie-journey/23-翻译PropertyListParser' }
          ]
        },
        {
          text: '第五部分：解析器篇',
          collapsed: true,
          items: [
            { text: '24 翻译 BinaryPropertyListParser', link: '/series/cangjie-journey/24-翻译BinaryPropertyListParser' },
            { text: '25 翻译 XMLPropertyListParser', link: '/series/cangjie-journey/25-翻译XMLPropertyListParser' },
            { text: '26 翻译 ASCIIPropertyListParser', link: '/series/cangjie-journey/26-翻译ASCIIPropertyListParser' }
          ]
        },
        {
          text: '第六部分：收尾篇',
          collapsed: false,
          items: [
            { text: '27 双版本验证、文档补齐与 PR 提交', link: '/series/cangjie-journey/27-收尾：双版本验证、文档补齐与PR提交' },
            { text: '28 PR 审核整改与覆盖率提升', link: '/series/cangjie-journey/28-PR审核整改与测试覆盖率提升' },
            { text: '29 数据类覆盖率攻坚与两个 BOM Bug', link: '/series/cangjie-journey/29-数据类覆盖率攻坚与两个BOM截断bug' },
            { text: '30 第二轮审核整改与 PR 合并', link: '/series/cangjie-journey/30-第二轮审核整改与PR合并' },
            { text: '31 发布到仓颉中心仓', link: '/series/cangjie-journey/31-发布到仓颉中心仓' }
          ]
        }
      ],

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
