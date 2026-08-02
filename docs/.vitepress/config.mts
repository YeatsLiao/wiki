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
          { text: 'AI原生架构师笔记', link: '/series/ai-native-architect/' },
          { text: '物联网平台设计解读', link: '/series/iot-platform-design/' },
          { text: 'Java启动速度优化解读', link: '/series/java-startup-optimization/' },
          { text: 'Chris Newland JVM工具解读', link: '/series/jvm-tools/' },
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
            { text: '01 Java 为什么启动慢', link: '/series/java-startup-optimization/01-Java为什么启动慢' },
            { text: '02 类加载与 AppCDS 优化', link: '/series/java-startup-optimization/02-类加载与AppCDS优化' },
            { text: '03 类提前初始化与 Heap Archive', link: '/series/java-startup-optimization/03-类提前初始化与HeapArchive' },
            { text: '04 JIT 预热与 AOT 编译的兴衰', link: '/series/java-startup-optimization/04-JIT预热与AOT编译的兴衰' },
            { text: '05 Spring 懒加载实战：MQTT 静默失效', link: '/series/java-startup-optimization/05-Spring懒加载实战：MQTT静默失效' },
            { text: '06 启动加速最佳实践与展望', link: '/series/java-startup-optimization/06-启动加速最佳实践与展望' }
          ]
        }
      ],

      '/series/jvm-tools/': [
        { text: '系列首页', link: '/series/jvm-tools/' },
        {
          text: 'Chris Newland JVM工具解读',
          items: [
            { text: '01 总览：一个人与一套 JVM 工具矩阵', link: '/series/jvm-tools/01-总览：一个人与一套JVM工具矩阵' },
            { text: '02 VM Options Explorer', link: '/series/jvm-tools/02-VMOptionsExplorer：把HotSpot参数黑盒拆开' },
            { text: '03 hsdis：让 JIT 说出机器语言', link: '/series/jvm-tools/03-hsdis：让JIT说出机器语言' },
            { text: '04 JITWatch', link: '/series/jvm-tools/04-JITWatch：看懂HotSpot在你的代码上做了什么' },
            { text: '05 JaCoLine', link: '/series/jvm-tools/05-JaCoLine：给你的启动脚本做个体检' },
            { text: '06 Byte-Me', link: '/series/jvm-tools/06-ByteMe：在浏览器里看Java怎么变成字节码' },
            { text: '07 JEP 三件套', link: '/series/jvm-tools/07-JEP三件套：摸透Java的演进路线图' },
            { text: '08 VM Intrinsics Explorer', link: '/series/jvm-tools/08-VMIntrinsicsExplorer：被HotSpot偷偷换掉的魔法方法' },
            { text: '09 GC Explorer', link: '/series/jvm-tools/09-GCExplorer：把垃圾回收器摊开给你看' },
            { text: '10 Optimizing Java', link: '/series/jvm-tools/10-OptimizingJava：把性能调优写成一本书' }
          ]
        }
      ],

      '/series/iot-sql-governance/': [
        { text: '系列首页', link: '/series/iot-sql-governance/' },
        {
          text: '物联网平台SQL治理手记',
          items: [
            { text: '01 开篇——手写 SQL 的隐患全景', link: '/series/iot-sql-governance/01-开篇-手写SQL的隐患全景' },
            { text: '02 SQL 注入——拼接与白名单改造', link: '/series/iot-sql-governance/02-SQL注入-拼接与白名单改造' },
            { text: '03 SELECT 反模式——显式列替代', link: '/series/iot-sql-governance/03-SELECT反模式-显式列替代' },
            { text: '04 性能反模式——前导通配与深分页', link: '/series/iot-sql-governance/04-性能反模式-前导通配与深分页' },
            { text: '05 死代码与接口一致性——清理与校验', link: '/series/iot-sql-governance/05-死代码与接口一致性-清理与校验' },
            { text: '06 附录：SqlWhitelistValidator 完整代码', link: '/series/iot-sql-governance/06-附录-SqlWhitelistValidator完整代码' }
          ]
        }
      ],

      '/series/iot-platform-design/': [
        { text: '系列首页', link: '/series/iot-platform-design/' },
        {
          text: '公有云 IoT 平台',
          collapsed: false,
          items: [
            {
              text: 'AWS',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/aws/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/aws/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/aws/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/aws/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/aws/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/aws/06-智能运维与高可用' }
              ]
            },
            {
              text: '微软 Azure',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/azure/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/azure/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/azure/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/azure/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/azure/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/azure/06-智能运维与高可用' }
              ]
            },
            {
              text: '阿里云',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/aliyun/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/aliyun/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/aliyun/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/aliyun/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/aliyun/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/aliyun/06-智能运维与高可用' }
              ]
            },
            {
              text: '华为云',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/huawei/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/huawei/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/huawei/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/huawei/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/huawei/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/huawei/06-智能运维与高可用' }
              ]
            },
            {
              text: '腾讯云',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/tencent/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/tencent/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/tencent/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/tencent/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/tencent/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/tencent/06-智能运维与高可用' }
              ]
            }
          ]
        },
        {
          text: '工业 IoT 平台',
          collapsed: false,
          items: [
            {
              text: '西门子 MindSphere',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/siemens/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/siemens/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/siemens/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/siemens/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/siemens/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/siemens/06-智能运维与高可用' }
              ]
            }
          ]
        },
        {
          text: '消费级 IoT 平台',
          collapsed: false,
          items: [
            {
              text: '小米米家',
              collapsed: true,
              items: [
                { text: '01 为什么需要物联网平台', link: '/series/iot-platform-design/mijia/01-为什么需要物联网平台' },
                { text: '02 稳定连接', link: '/series/iot-platform-design/mijia/02-稳定连接' },
                { text: '03 消息与规则引擎', link: '/series/iot-platform-design/mijia/03-消息与规则引擎' },
                { text: '04 物模型与数字孪生', link: '/series/iot-platform-design/mijia/04-物模型与数字孪生' },
                { text: '05 海量设备管理', link: '/series/iot-platform-design/mijia/05-海量设备管理' },
                { text: '06 智能运维与高可用', link: '/series/iot-platform-design/mijia/06-智能运维与高可用' }
              ]
            }
          ]
        },
        {
          text: '深度拆解',
          collapsed: false,
          items: [
            {
              text: '火山引擎（8篇连贯叙事）',
              collapsed: true,
              items: [
                { text: '01 为什么要平台化', link: '/series/iot-platform-design/volcengine/01-为什么要平台化' },
                { text: '02 产品与设备', link: '/series/iot-platform-design/volcengine/02-产品与设备' },
                { text: '03 物模型', link: '/series/iot-platform-design/volcengine/03-物模型' },
                { text: '04 网关与子设备', link: '/series/iot-platform-design/volcengine/04-网关与子设备' },
                { text: '05 设备影子与通信', link: '/series/iot-platform-design/volcengine/05-设备影子与通信' },
                { text: '06 规则引擎', link: '/series/iot-platform-design/volcengine/06-规则引擎' },
                { text: '07 实战：智慧农业闭环', link: '/series/iot-platform-design/volcengine/07-实战：智慧农业闭环' },
                { text: '08 数据分析与可视化', link: '/series/iot-platform-design/volcengine/08-数据分析与可视化' }
              ]
            }
          ]
        }
      ],

      '/series/dotnet-build/': [
        { text: '系列首页', link: '/series/dotnet-build/' },
        {
          text: '.NET构建机制剖析',
          items: [
            { text: '01 Debug 与 Release 的本质差异', link: '/series/dotnet-build/01-Debug与Release的本质差异' },
            { text: '02 配置文件增量构建原理', link: '/series/dotnet-build/02-配置文件增量构建原理' },
            { text: '03 Design-Time Build 解析', link: '/series/dotnet-build/03-DesignTimeBuild解析' },
            { text: '04 构建产物与清理机制', link: '/series/dotnet-build/04-构建产物与清理机制' }
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

      '/series/ai-native-architect/': [
        { text: '系列首页', link: '/series/ai-native-architect/' },
        {
          text: '认知与决策',
          collapsed: false,
          items: [
            { text: '01 范式转变：AI原生与不确定性编程', link: '/series/ai-native-architect/01-范式转变：AI原生应用与不确定性编程' },
            { text: '02 Token经济学与模型路由', link: '/series/ai-native-architect/02-Token经济学与模型路由：成本、延迟、质量的三角决策' },
            { text: '03 从Demo到生产', link: '/series/ai-native-architect/03-从Demo到生产：Prompt工程化、数据飞轮与隐私架构' }
          ]
        },
        {
          text: '提示工程进阶',
          collapsed: true,
          items: [
            { text: '04 结构化输出', link: '/series/ai-native-architect/04-结构化输出：JSONMode与FunctionCalling重塑接口设计' },
            { text: '05 思维链变体 ToT 与 GoT', link: '/series/ai-native-architect/05-思维链变体：ToT与GoT的工程实现' },
            { text: '06 动态 Few-Shot', link: '/series/ai-native-architect/06-动态Few-Shot：基于语义相似度检索示例' },
            { text: '07 元提示', link: '/series/ai-native-architect/07-元提示：让大模型自己优化Prompt' },
            { text: '08 DSPy 框架', link: '/series/ai-native-architect/08-DSPy框架：用编程方式编译和优化LLM调用' },
            { text: '09 防御性 Prompt 设计', link: '/series/ai-native-architect/09-防御性Prompt设计：对抗Injection与Jailbreak' },
            { text: '10 角色设定卡', link: '/series/ai-native-architect/10-角色设定卡：提升模型的情商与专业度' },
            { text: '11 长上下文陷阱', link: '/series/ai-native-architect/11-长上下文陷阱：LostintheMiddle及应对策略' },
            { text: '12 Prompt 评估体系', link: '/series/ai-native-architect/12-Prompt评估体系：构建自动化测试集' },
            { text: '13 多模态 Prompting', link: '/series/ai-native-architect/13-多模态Prompting：图文混合输入实践与调优' }
          ]
        },
        {
          text: 'RAG 架构演进',
          collapsed: true,
          items: [
            { text: '14 长上下文会取代 RAG 吗', link: '/series/ai-native-architect/14-长上下文会取代RAG吗：辩证分析' },
            { text: '15 高级分块策略', link: '/series/ai-native-architect/15-高级分块策略：语义分割、父子索引与多级检索' },
            { text: '16 混合检索', link: '/series/ai-native-architect/16-混合检索：BM25与向量检索的加权融合' },
            { text: '17 重排序 Cross-Encoder', link: '/series/ai-native-architect/17-重排序：Cross-Encoder作为RAG的精准过滤器' },
            { text: '18 GraphRAG 实战', link: '/series/ai-native-architect/18-GraphRAG实战：知识图谱增强跨文档推理' },
            { text: '19 查询重写 HyDE', link: '/series/ai-native-architect/19-查询重写：HyDE与多查询分解' },
            { text: '20 Self-RAG 架构', link: '/series/ai-native-architect/20-Self-RAG架构：按需检索与自我修正' },
            { text: '21 RAPTOR 索引', link: '/series/ai-native-architect/21-RAPTOR索引：递归树状索引提升长文档全局理解' },
            { text: '22 多模态 RAG', link: '/series/ai-native-architect/22-多模态RAG：索引PDF中的表格、图表与图片' },
            { text: '23 RAG 评测', link: '/series/ai-native-architect/23-RAG评测：Ragas与TruLens实践' }
          ]
        },
        {
          text: 'Agent 智能体',
          collapsed: true,
          items: [
            { text: '24 Agent 架构通识', link: '/series/ai-native-architect/24-Agent架构通识：从ReAct到Plan-and-Solve' },
            { text: '25 工具使用设计模式', link: '/series/ai-native-architect/25-工具使用设计模式：为LLM定义清晰鲁棒的API' },
            { text: '26 多智能体协作', link: '/series/ai-native-architect/26-多智能体协作：AutoGen与CrewAI的角色分工' },
            { text: '27 记忆系统', link: '/series/ai-native-architect/27-记忆系统：短期记忆、长期记忆与反射机制' },
            { text: '28 规划能力', link: '/series/ai-native-architect/28-规划能力：任务拆解与依赖管理' },
            { text: '29 自主编码 Agent', link: '/series/ai-native-architect/29-自主编码Agent：Devin与开源替代的技术原理' },
            { text: '30 浏览器自动化 Agent', link: '/series/ai-native-architect/30-浏览器自动化Agent：基于Playwright的WebAgent' },
            { text: '31 人机回环', link: '/series/ai-native-architect/31-人机回环：Agent关键操作的人工确认设计' },
            { text: '32 Agent 调试与监控', link: '/series/ai-native-architect/32-Agent调试与监控：LangSmith追踪思考过程与调用链' },
            { text: '33 具身智能', link: '/series/ai-native-architect/33-具身智能：将Agent接入物理世界' }
          ]
        },
        {
          text: 'LLMOps 与工程化基础设施',
          collapsed: true,
          items: [
            { text: '34 LLM 网关设计', link: '/series/ai-native-architect/34-LLM网关设计：APIKey、限流、缓存与故障转移' },
            { text: '35 向量数据库选型', link: '/series/ai-native-architect/35-向量数据库选型：Milvus、Pinecone、Weaviate与pgvector' },
            { text: '36 评估驱动开发', link: '/series/ai-native-architect/36-评估驱动开发：以Evals为核心的开发流水线' },
            { text: '37 合成数据工程', link: '/series/ai-native-architect/37-合成数据工程：用大模型生成训练与评测数据' },
            { text: '38 微调 Ops', link: '/series/ai-native-architect/38-微调Ops：LoRA适配器的版本管理与快速切换' },
            { text: '39 推理加速', link: '/series/ai-native-architect/39-推理加速：KVCache优化与投机采样' },
            { text: '40 流式输出实践', link: '/series/ai-native-architect/40-流式输出实践：SSE协议与Markdown增量渲染' },
            { text: '41 AI 应用安全防护', link: '/series/ai-native-architect/41-AI应用安全防护：PII过滤与内容审核' },
            { text: '42 无服务器 AI', link: '/series/ai-native-architect/42-无服务器AI：VercelAISDK与CloudflareWorkers' },
            { text: '43 私有化部署 ROI', link: '/series/ai-native-architect/43-私有化部署ROI：何时切换到自托管Llama3' }
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
