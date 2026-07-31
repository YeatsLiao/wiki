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
          { text: '仓颉共建之旅', link: '/series/cangjie-journey/' },
          { text: '23 种设计模式实战', link: '/series/design-patterns/' },
          { text: 'Java启动速度优化解读', link: '/series/java-startup-optimization/' },
          { text: '物联网平台SQL治理手记', link: '/series/iot-sql-governance/' },
          { text: '.NET构建机制剖析', link: '/series/dotnet-build/' },
          { text: '开发者速查手册', link: '/series/handbook/' },
          { text: '技术手记单篇', link: '/series/tech-notes/' }
        ]
      },
      {
        text: '翻译系列',
        items: [
          { text: 'RXTX 中文文档', link: '/translations/rxtx/' }
        ]
      },
      { text: '随笔', link: '/essays/' },
      {
        text: '在线实验',
        items: [
          { text: '设计模式交互演示站', link: 'https://yeatsliao.github.io/design-patterns-23/' },
          { text: 'Java 可视化实验室', link: 'https://yeatsliao.github.io/java-handson-lab/' }
        ]
      }
    ],

    sidebar: {
      '/series/java-startup-optimization/': [
        { text: '系列首页', link: '/series/java-startup-optimization/' },
        {
          text: 'Java启动速度优化解读',
          items: [
            { text: '一 Java为什么启动慢', link: '/series/java-startup-optimization/01-Java为什么启动慢' },
            { text: '二 类加载与 AppCDS 优化', link: '/series/java-startup-optimization/02-类加载与AppCDS优化' },
            { text: '三 类提前初始化与 Heap Archive', link: '/series/java-startup-optimization/03-类提前初始化与HeapArchive' },
            { text: '四 JIT 预热与 AOT 编译的兴衰', link: '/series/java-startup-optimization/04-JIT预热与AOT编译的兴衰' },
            { text: '五 Spring 懒加载实战：MQTT 静默失效', link: '/series/java-startup-optimization/05-Spring懒加载实战：MQTT静默失效' },
            { text: '六 启动加速最佳实践与展望', link: '/series/java-startup-optimization/06-启动加速最佳实践与展望' }
          ]
        }
      ],

      '/series/iot-sql-governance/': [
        { text: '系列首页', link: '/series/iot-sql-governance/' },
        {
          text: '物联网平台SQL治理手记',
          items: [
            { text: '一 开篇——手写 SQL 的隐患全景', link: '/series/iot-sql-governance/01-开篇-手写SQL的隐患全景' },
            { text: '二 SQL 注入——拼接与白名单改造', link: '/series/iot-sql-governance/02-SQL注入-拼接与白名单改造' },
            { text: '三 SELECT 反模式——显式列替代', link: '/series/iot-sql-governance/03-SELECT反模式-显式列替代' },
            { text: '四 性能反模式——前导通配与深分页', link: '/series/iot-sql-governance/04-性能反模式-前导通配与深分页' },
            { text: '五 死代码与接口一致性——清理与校验', link: '/series/iot-sql-governance/05-死代码与接口一致性-清理与校验' },
            { text: '附录 SqlWhitelistValidator 完整代码', link: '/series/iot-sql-governance/06-附录-SqlWhitelistValidator完整代码' }
          ]
        }
      ],

      '/series/dotnet-build/': [
        { text: '系列首页', link: '/series/dotnet-build/' },
        {
          text: '.NET构建机制剖析',
          items: [
            { text: '一 Debug 与 Release 的本质差异', link: '/series/dotnet-build/01-Debug与Release的本质差异' },
            { text: '二 配置文件增量构建原理', link: '/series/dotnet-build/02-配置文件增量构建原理' },
            { text: '三 Design-Time Build 解析', link: '/series/dotnet-build/03-DesignTimeBuild解析' },
            { text: '四 构建产物与清理机制', link: '/series/dotnet-build/04-构建产物与清理机制' }
          ]
        }
      ],

      '/series/handbook/': [
        { text: '手册导览', link: '/series/handbook/' },
        {
          text: '开发者速查手册',
          items: [
            { text: '01 Linux 常用操作速查', link: '/series/handbook/01-Linux常用操作速查' },
            { text: '02 Windows 命令行与批处理速查', link: '/series/handbook/02-Windows命令行与批处理速查' },
            { text: '03 Docker 速查', link: '/series/handbook/03-Docker速查' },
            { text: '04 Git 实用技巧速查', link: '/series/handbook/04-Git实用技巧速查' },
            { text: '05 网络基础速查', link: '/series/handbook/05-网络基础速查' },
            { text: '06 编码自检与接口幂等速查', link: '/series/handbook/06-编码自检与接口幂等速查' }
          ]
        }
      ],

      '/essays/': [
        { text: '合集首页', link: '/essays/' },
        {
          text: '随笔',
          items: [
            { text: '01 求职面试手记', link: '/essays/01-求职面试手记：把面试当收费站，而不是终点' },
            { text: '02 人月神话读书笔记', link: '/essays/02-人月神话读书笔记：五十年前的坑今天还在踩' },
            { text: '03 产品思维课笔记', link: '/essays/03-产品思维课笔记：一个后端开发眼中的产品方法论' },
            { text: '04 书影音与工具清单', link: '/essays/04-书影音与工具清单：改变过我认知的输入' },
            { text: '05 心理学课程地图', link: '/essays/05-心理学课程地图：一个程序员的旁观笔记' },
            { text: '06 不聊代码：五个工作方法', link: '/essays/06-不聊代码：这些年我最想安利的五个工作方法' }
          ]
        }
      ],

      '/series/tech-notes/': [
        { text: '合集首页', link: '/series/tech-notes/' },
        {
          text: '技术手记单篇',
          items: [
            { text: '我部署了 OutfitAnyone', link: '/series/tech-notes/我部署了OutfitAnyone，然后发现整个仓库没有一行模型代码' },
            { text: 'xlsx 总是变 xlsm 排查记', link: '/series/tech-notes/xlsx总是变xlsm排查记：一次Synaptics宏病毒的发现与清除' },
            { text: 'Git 分支合并 rename-delete 冲突实战', link: '/series/tech-notes/Git分支合并rename-delete冲突解决实战' }
          ]
        }
      ],

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

      '/series/design-patterns/': [
        { text: '系列首页', link: '/series/design-patterns/' },
        {
          text: '创建型模式',
          collapsed: false,
          items: [
            { text: '01 单例模式 (Singleton)', link: '/series/design-patterns/01-单例模式' },
            { text: '02 工厂方法模式 (Factory Method)', link: '/series/design-patterns/02-工厂方法模式' },
            { text: '03 抽象工厂模式 (Abstract Factory)', link: '/series/design-patterns/03-抽象工厂模式' },
            { text: '04 建造者模式 (Builder)', link: '/series/design-patterns/04-建造者模式' },
            { text: '05 原型模式 (Prototype)', link: '/series/design-patterns/05-原型模式' }
          ]
        },
        {
          text: '结构型模式',
          collapsed: true,
          items: [
            { text: '06 适配器模式 (Adapter)', link: '/series/design-patterns/06-适配器模式' },
            { text: '07 桥接模式 (Bridge)', link: '/series/design-patterns/07-桥接模式' },
            { text: '08 组合模式 (Composite)', link: '/series/design-patterns/08-组合模式' },
            { text: '09 装饰器模式 (Decorator)', link: '/series/design-patterns/09-装饰器模式' },
            { text: '10 外观模式 (Facade)', link: '/series/design-patterns/10-外观模式' },
            { text: '11 享元模式 (Flyweight)', link: '/series/design-patterns/11-享元模式' },
            { text: '12 代理模式 (Proxy)', link: '/series/design-patterns/12-代理模式' }
          ]
        },
        {
          text: '行为型模式',
          collapsed: true,
          items: [
            { text: '13 责任链模式 (Chain of Responsibility)', link: '/series/design-patterns/13-责任链模式' },
            { text: '14 命令模式 (Command)', link: '/series/design-patterns/14-命令模式' },
            { text: '15 解释器模式 (Interpreter)', link: '/series/design-patterns/15-解释器模式' },
            { text: '16 迭代器模式 (Iterator)', link: '/series/design-patterns/16-迭代器模式' },
            { text: '17 中介者模式 (Mediator)', link: '/series/design-patterns/17-中介者模式' },
            { text: '18 备忘录模式 (Memento)', link: '/series/design-patterns/18-备忘录模式' },
            { text: '19 观察者模式 (Observer)', link: '/series/design-patterns/19-观察者模式' },
            { text: '20 状态模式 (State)', link: '/series/design-patterns/20-状态模式' },
            { text: '21 策略模式 (Strategy)', link: '/series/design-patterns/21-策略模式' },
            { text: '22 模板方法模式 (Template Method)', link: '/series/design-patterns/22-模板方法模式' },
            { text: '23 访问者模式 (Visitor)', link: '/series/design-patterns/23-访问者模式' }
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
