# 我「部署」了 OutfitAnyone，然后发现整个仓库没有一行模型代码

> 2024 年 5 月，我兴冲冲地想在本地跑一跑阿里的虚拟试衣项目 OutfitAnyone。环境装好了、依赖装好了、程序也跑起来了——然后我发现，我部署的只是一个「遥控器」。这篇文章一半是部署记录，一半是对「假开源」现象的吐槽。

## 一、OutfitAnyone 是什么

[OutfitAnyone](https://github.com/HumanAIGC/OutfitAnyone) 是阿里巴巴智能计算研究院（Institute for Intelligent Computing, Alibaba Group）发布的超高质量虚拟试衣（Virtual Try-On）项目，同门师兄弟还有更出名的 AnimateAnyone（让静态人物照片跳舞的那个）。论文效果确实惊艳：任意服装 + 任意人物，穿上就走，细节保真度吊打当时的开源方案。

GitHub 仓库 5k+ star，README 排版精美，还有 arXiv 论文（[2407.16224](https://arxiv.org/abs/2407.16224)）。一切看起来都像一个正经开源项目。

## 二、当年的「部署」记录

### 2.1 克隆与环境

官方仓库里没有可运行的代码（这个后面细说），社区把 Hugging Face Space 上的 Gradio 演示壳扒了下来做成可本地运行的客户端，我 fork 了一份来跑：

![git clone](/images/series/tech-notes/outfitanyone/01-git-clone.png)

整个仓库 24MB，101 个对象——对一个「AI 试衣模型」来说小得可疑，但当时没多想。

PyCharm 打开，创建 venv（Python 3.9），换阿里云 pip 源后装依赖，`requirements.txt` 里的核心依赖只有两个：`opencv-python` 和 `gradio==4.15.0`。

![pip install](/images/series/tech-notes/outfitanyone/04-pip-install.png)

一个深度学习项目，requirements 里没有 torch、没有 diffusers、没有 transformers——**这时候其实已经真相大白了，只是我还没反应过来**。

### 2.2 app.py 里都是什么

![app.py](/images/series/tech-notes/outfitanyone/02-pycharm-app-py.png)

打开 `app.py`，映入眼帘的是几十行这样的代码：

```python
"AI Model Xuanxuan_0": 'models/xiaoxuan_online/Xuanxuan_0.png',
"AI Model Yaqi_1": 'models/yaqi/Yaqi_1.png',
"AI Model Yifeng_2": 'models/yifeng_online/Yifeng_2.png',
...
```

所谓 `models/` 目录，装的不是模型权重，是**预置模特的 PNG 照片**。再往下翻，还有一个 `add_waterprint()` 函数——给生成结果加水印用的。这就是整个「项目」的全部本地逻辑：选一张预置模特图，选一件衣服，然后……发请求。

### 2.3 真正的「模型」在哪

跑起来之前还要设置一个环境变量（Windows 下 `export` 不可用，要改 `set`，这是当时唯一称得上「踩坑」的地方）：

```bash
# Linux / macOS
export VARIABLE_NAME='https://humanaigc-outfitanyone.hf.space/--replicas/adoil/'

# Windows
set VARIABLE_NAME=https://humanaigc-outfitanyone.hf.space/--replicas/adoil/
```

这个 URL 就是答案——它是官方 Hugging Face Space 的 Gradio API 端点：

![HF Space API](/images/series/tech-notes/outfitanyone/05-hf-space-api.png)

所以整条链路是：

```
我的电脑（Gradio 客户端壳）
    │  gradio_client.predict()
    ▼
HuggingFace Space（官方黑盒 Demo）
    │  真正的模型推理发生在这里，代码和权重都看不到
    ▼
返回一张带水印的结果图
```

我装的 venv、配的解释器、下的依赖，服务的全部意义就是——**把点按钮这个动作变成了敲代码**。模型没有在我机器上运行过哪怕一毫秒。

## 三、批判环节：这是开源吗？

### 3.1 仓库里有什么，没有什么

官方仓库 [HumanAIGC/OutfitAnyone](https://github.com/HumanAIGC/OutfitAnyone) 截至今天的全部内容：

| 有 | 没有 |
| :--- | :--- |
| 精美的 README 和效果图 | ❌ 训练代码 |
| LICENSE 文件 | ❌ 推理代码 |
| arXiv 论文引用格式 | ❌ 模型权重 |
| 「别忘了给我们点 star 😜」 | ❌ 任何可复现的东西 |

Hugging Face 的论文页面直接挂着 "**No Code**" 标签；Reddit 上 "Is the code going to be released?" 的提问石沉大海；仓库 issue 里催代码的帖子从 2023 年 12 月排到现在。答案已经很清楚了：**不放，从来就没打算放**。

### 3.2 为什么说它是「假开源」

我不反对公司保护商业模型——虚拟试衣直接对接淘宝的电商场景，不开源完全可以理解。**问题在于形式**：

1. **用 GitHub 仓库的外壳收割开源社区的注意力**。star、fork、watch，这些指标本是社区对「可用代码」的投票，一个只有 README 的仓库拿走 5k+ star，挤占的是真正开源项目的能见度
2. **「demo 即开源」的话术误导**。放一个 HF Space 黑盒 demo，社区自然会衍生出各种「本地部署教程」（我当年就是受害者之一），无数人装好环境才发现自己部署的是个 API 调用器
3. **学术信用与工程信用的错位**。论文可以只发效果，但把仓库挂在 GitHub 上就是在暗示「这里有代码」。诚实的做法是像很多公司一样只放 project page——HumanAIGC 自己就有 [humanaigc.github.io/outfit-anyone](https://humanaigc.github.io/outfit-anyone/)，仓库完全是多余的 star 收集器
4. **这是惯犯行为**。同门的 AnimateAnyone 当年也是空仓库挂了几个月，社区骂声太大后才放出部分代码，权重同样没有。以至于后来社区里流传一个判断标准：**HumanAIGC 的仓库，先看 requirements.txt 里有没有 torch**

### 3.3 一个简单的鉴别清单

吃一堑长一智，之后再看到「开源」AI 项目，我会先查这四样：

- [ ] `requirements.txt` / `setup.py` 里有没有深度学习框架（torch/tensorflow/jax）
- [ ] 仓库里有没有 `.py` 文件是在定义网络结构而不是调 API
- [ ] HuggingFace 上有没有可下载的权重文件（不是 Space，是 Model）
- [ ] issue 里搜 "code" 和 "weights"，看官方怎么回复催更的人

四项全空的，直接按「广告仓库」处理，star 都不用点。

## 四、后记

那次「部署」花了我一个下午，最后得到的能力等价于打开浏览器访问 HF Space 网页。但回头看也不算全亏——它让我从此对「开源」这两个字祛魅：**开源的最小单位是可复现，不是 README。**

顺带一提，虚拟试衣赛道后来真有能本地跑的开源项目（IDM-VTON、OOTDiffusion、CatVTON 等，代码权重俱全），感兴趣的话那才是值得花下午的地方。

*部署时间：2024-05-25；仓库状态核实时间：2026-07-30，官方仓库依旧没有一行模型代码。*
